window.ZSpace=function(){"use strict";var AutoStereoState={Initial:0,IdleMono:1,IdleStereo:2,AnimatingToMono:3,AnimatingToStereo:4};var displayDevice=null;var stylusDevice=null;var stylusButtonsDevice=null;var zspace=function(gl,c){this.gl=gl;this.canvas=c;this.leftFrameBuffer=null;this.leftRenderBuffer=null;this.rightFrameBuffer=null;this.rightRenderBuffer=null;this.leftFrameBufferTexture=null;this.rightFrameBufferTexture=null;this.swapStereo=false;this.nearClip=.1;this.farClip=1e4;this.viewerScale=1;this.viewerScaleMatrix=mat4.create();this.cameraOffset=vec3.fromValues(0,.345,.222);this.centerViewMatrix=mat4.create();this.leftViewMatrix=mat4.create();this.rightViewMatrix=mat4.create();this.centerProjectionMatrix=mat4.create();this.leftProjectionMatrix=mat4.create();this.rightProjectionMatrix=mat4.create();this.stylusCameraMatrix=mat4.create();this.viewportSpaceStylusPose=mat4.create();this.displaySpaceStylusPose=mat4.create();this.displaySpaceHeadPositionNative=vec3.create();this.displaySpaceHeadOrientationNative=quat.create();this.displaySpaceHeadPose=mat4.create();this.viewportSpaceHeadPose=mat4.create();this.cameraToViewportMatrix=mat4.create();this.cameraToDisplayMatrixNative=mat4.create();this.cameraToDisplayMatrix=mat4.create();this.displayToCameraMatrix=mat4.create();this.cameraSpaceCanvasPose=mat4.create();this.cameraSpaceCanvasSize=[0,0];this.displayAngle=[90,0,0];this.buttonPressed=[0,0,0];this.usePortalModeAngle=true;this.customDisplayAngle=[90,0,0];this.useExternalTexture=false;this.displaySize=[0,0];this.displayResolution=[0,0];this.displayScaleFactor=[0,0];this.IPD=.06;this.glassesOffset=.01;this.defaultDisplaySpaceHeadPosition=vec3.fromValues(0,0,.3);this.defaultDisplaySpaceHeadOrientation=quat.create();this.autoStereoTransitionDurationMilliseconds=1e3;this.transitionToMonoDelayMilliseconds=3e3;this.stereoEnable=true;this.stylusGamepad=null;this.browserViewportOffset=null;this.canvasPosition=[0,0];this.canvasSize=[0,0];this.viewportHalfWidth=0;this.viewportHalfHeight=0;this.renderStereo=false;this.presenting=false;this.glassesVisible=false;this.stylusVisible=false;this.fullscreen=false;this.frameCount=0;this.lastUpdateTime=performance.now();this.initialTransitionToAutoStereoIdleMonoStateDelayFrames=5;this.timeRemainingBeforeTransitionToMono=0;this.autoStereoState=AutoStereoState.Initial;this.autoStereoTween=null;this.activeIPD=this.IPD;this.activeDisplaySpaceHeadPosition=vec3.create();this.activeDisplaySpaceHeadOrientation=quat.create()};function computeBrowserViewportOffsetUsingHeuristic(){var frameLeftOffset=0;var frameTopOffset=0;var curWindow=window;while(curWindow.frameElement!==null){var curFrameElementRect=curWindow.frameElement.getBoundingClientRect();frameLeftOffset+=curFrameElementRect.left;frameTopOffset+=curFrameElementRect.top;if(curWindow.parent===curWindow){break}curWindow=curWindow.parent}var topLevelWindow=curWindow;var windowWidthDifference=topLevelWindow.outerWidth-topLevelWindow.innerWidth;var browserViewportLeftOffset=windowWidthDifference*.5;var windowHeightDifference=topLevelWindow.outerHeight-topLevelWindow.innerHeight;var browserViewportTopOffset=windowHeightDifference-browserViewportLeftOffset;if(browserViewportTopOffset<0){browserViewportTopOffset=0}var totalLeftOffset=browserViewportLeftOffset+frameLeftOffset;var totalTopOffset=browserViewportTopOffset+frameTopOffset;return[totalLeftOffset,totalTopOffset]}function updateCanvasPosition(zspace){var canvasRect=zspace.canvas.getBoundingClientRect();zspace.canvasPosition[0]=window.screenX+canvasRect.left-screen.availLeft+zspace.browserViewportOffset[0];zspace.canvasPosition[1]=window.screenY+canvasRect.top+zspace.browserViewportOffset[1]}function keyEvent(e,zspace){var e=window.event;if(e.keyCode=="90"){zspace.swapStereo=!zspace.swapStereo}if(e.keyCode=="80"){if(displayDevice!=null){if(zspace.swapStereo){displayDevice.requestPresent([{source:zspace.canvas,stereoTextures:[zspace.rightFrameBufferTexture,zspace.leftFrameBufferTexture]}]).then((function(){zspace.presenting=true;console.log("Presenting 1")}),(function(){zspace.presenting=false;console.log("Not Presenting 1")}))}else{displayDevice.requestPresent([{source:zspace.canvas,stereoTextures:[zspace.leftFrameBufferTexture,zspace.rightFrameBufferTexture]}]).then((function(){zspace.presenting=true;console.log("Presenting 2")}),(function(){zspace.presenting=false;console.log("Not Presenting 2")}))}}}}function mouseEvent(e,zspace){zspace.setBrowserViewportOffset(e.screenX-e.clientX-window.screenX,e.screenY-e.clientY-window.screenY)}function zSpaceConnectHandler(e,zspace){zspace.stylusGamepad=e.gamepad}function zSpaceDisconnectHandler(e,zspace){zspace.stylusGamepad=null}function onVRPresentChange(zspace){if(displayDevice!=null){if(displayDevice.isPresenting){zspace.presenting=true}else{zspace.presenting=false}}}function onVRRequestPresent(e,zspace){if(e){zspace.glassesVisible=e.reason=="mounted"}if(displayDevice!=null){if(zspace.swapStereo){displayDevice.requestPresent([{source:zspace.canvas,stereoTextures:[zspace.rightFrameBufferTexture,zspace.leftFrameBufferTexture]}]).then((function(){zspace.presenting=true;console.log("Presenting 1")}),(function(){zspace.presenting=false;console.log("Not Presenting 1")}))}else{displayDevice.requestPresent([{source:zspace.canvas,stereoTextures:[zspace.leftFrameBufferTexture,zspace.rightFrameBufferTexture]}]).then((function(){zspace.presenting=true;console.log("Presenting 2")}),(function(){zspace.presenting=false;console.log("Not Presenting 2")}))}}}function onVRExitPresent(zspace){if(displayDevice!=null){if(!displayDevice.isPresenting){return}displayDevice.exitPresent().then((function(){zspace.presenting=false;console.log("Exit Presenting 1")}),(function(){zspace.presenting=true;console.log("Exit Presenting 2")}))}}function createMat4FromYXRotation(angleY,angleX){var cosX=Math.cos(angleX);var sinX=Math.sin(angleX);var cosY=Math.cos(angleY);var sinY=Math.sin(angleY);return mat4.fromValues(cosY,0,sinY,0,-sinX*sinY,cosX,sinX*cosY,0,-cosX*sinY,-sinX,cosX*cosY,0,0,0,0,1)}function computeCameraSpaceToViewportSpaceMatrix(resultMatrix,displayAngle,cameraOffset,viewerScale){var displayAngleX=glMatrix.toRadian(displayAngle[0]-90);var displayAngleY=glMatrix.toRadian(displayAngle[1]);var displayRotationMatrix=createMat4FromYXRotation(displayAngleY,displayAngleX);var cameraAngleX=Math.atan2(-cameraOffset[1],cameraOffset[2]);var cameraAngleY=Math.atan2(-cameraOffset[0],cameraOffset[2]);var cameraRotationMatrix=createMat4FromYXRotation(cameraAngleY,cameraAngleX);var inverseDisplayRotationMatrix=mat4.create();mat4.invert(inverseDisplayRotationMatrix,displayRotationMatrix);var cameraOffsetTranslationMatrix=mat4.create();mat4.fromTranslation(cameraOffsetTranslationMatrix,cameraOffset);var viewerScaleVec=vec3.fromValues(viewerScale,viewerScale,viewerScale);var inverseViewerScaleScalingMatrix=mat4.create();mat4.fromScaling(inverseViewerScaleScalingMatrix,viewerScaleVec);mat4.invert(inverseViewerScaleScalingMatrix,inverseViewerScaleScalingMatrix);mat4.multiply(resultMatrix,inverseDisplayRotationMatrix,cameraOffsetTranslationMatrix);mat4.multiply(resultMatrix,resultMatrix,cameraRotationMatrix);mat4.multiply(resultMatrix,resultMatrix,inverseViewerScaleScalingMatrix)}function computeEyeViewMatrix(viewMatrix,eyePosition,cameraSpaceToViewportSpaceMatrix){var eyePositionNegated=vec3.create();vec3.negate(eyePositionNegated,eyePosition);var eyePositionTranslationMatrix=mat4.create();mat4.fromTranslation(eyePositionTranslationMatrix,eyePositionNegated);mat4.multiply(viewMatrix,eyePositionTranslationMatrix,cameraSpaceToViewportSpaceMatrix)}var TweenEaseType={Linear:0,EaseInQuad:1,EaseOutQuad:2,EaseInExpo:3,EaseOutExpo:4};function Tween(durationMilliseconds){this.durationMilliseconds=durationMilliseconds;this.onUpdate=null;this.onComplete=null;this.easeType=TweenEaseType.Linear;this.elapsedTimeMilliseconds=0;this.normalizedTime=0;this.isDone=false}Tween.prototype.update=function update(timeDeltaMilliseconds){if(this.isDone){return}this.elapsedTimeMilliseconds+=timeDeltaMilliseconds;if(this.elapsedTimeMilliseconds>0){var normalizedTime=this.elapsedTimeMilliseconds/this.durationMilliseconds;if(normalizedTime>1){normalizedTime=1}switch(this.easeType){case TweenEaseType.Linear:break;case TweenEaseType.EaseInQuad:normalizedTime=normalizedTime*normalizedTime;break;case TweenEaseType.EaseOutQuad:normalizedTime=-normalizedTime*(normalizedTime-2);break;case TweenEaseType.EaseInExpo:normalizedTime=Math.pow(2,10*(normalizedTime-1));break;case TweenEaseType.EaseOutExpo:normalizedTime=-Math.pow(2,-10*normalizedTime)+1;break;default:normalizedTime=1;break}this.normalizedTime=normalizedTime}if(this.onUpdate){this.onUpdate(this)}if(this.elapsedTimeMilliseconds>=this.durationMilliseconds){this.isDone=true;if(this.onComplete){this.onComplete(this)}}};function lerpScalar(a,b,t){return a+t*(b-a)}function updateAutoStereoActiveValuesForAnimation(zspace,normalizedTime,startDisplaySpaceHeadPosition,endDisplaySpaceHeadPosition,startDisplaySpaceHeadOrientation,endDisplaySpaceHeadOrientation,startIPD,endIPD){vec3.lerp(zspace.activeDisplaySpaceHeadPosition,startDisplaySpaceHeadPosition,endDisplaySpaceHeadPosition,normalizedTime);quat.lerp(zspace.activeDisplaySpaceHeadOrientation,startDisplaySpaceHeadOrientation,endDisplaySpaceHeadOrientation,normalizedTime);zspace.activeIPD=lerpScalar(startIPD,endIPD,normalizedTime)}function updateAutoStereoStateInitial(zspace){if(zspace.glassesVisible){vec3.copy(zspace.activeDisplaySpaceHeadPosition,zspace.displaySpaceHeadPositionNative);quat.copy(zspace.activeDisplaySpaceHeadOrientation,zspace.displaySpaceHeadOrientationNative);zspace.activeIPD=zspace.IPD;zspace.timeRemainingBeforeTransitionToMono=zspace.transitionToMonoDelayMilliseconds;zspace.autoStereoState=AutoStereoState.IdleStereo}else{vec3.copy(zspace.activeDisplaySpaceHeadPosition,zspace.defaultDisplaySpaceHeadPosition);quat.copy(zspace.activeDisplaySpaceHeadOrientation,zspace.defaultDisplaySpaceHeadOrientation);zspace.activeIPD=0;if(zspace.frameCount>zspace.initialTransitionToAutoStereoIdleMonoStateDelayFrames){zspace.autoStereoState=AutoStereoState.IdleMono}}if(zspace.receivedFirstDisplayActiveEvent){zspace.autoStereoState=nextAutoStereoState}}function updateAutoStereoStateIdleMono(zspace){if(zspace.glassesVisible){zspace.autoStereoState=AutoStereoState.AnimatingToStereo;var autoStereoTween=new Tween(zspace.autoStereoTransitionDurationMilliseconds);autoStereoTween.onUpdate=function(tween){updateAutoStereoActiveValuesForAnimation(zspace,tween.normalizedTime,zspace.defaultDisplaySpaceHeadPosition,zspace.displaySpaceHeadPositionNative,zspace.defaultDisplaySpaceHeadOrientation,zspace.displaySpaceHeadOrientationNative,0,zspace.IPD)};autoStereoTween.onComplete=function(){zspace.autoStereoState=AutoStereoState.IdleStereo;zspace.timeRemainingBeforeTransitionToMono=zspace.transitionToMonoDelayMilliseconds;zspace.autoStereoTween=null};autoStereoTween.easeType=TweenEaseType.EaseOutQuad;zspace.autoStereoTween=autoStereoTween}}function updateAutoStereoStateIdleStereo(zspace,timeDeltaMilliseconds){if(zspace.glassesVisible){zspace.timeRemainingBeforeTransitionToMono=zspace.transitionToMonoDelayMilliseconds;vec3.copy(zspace.activeDisplaySpaceHeadPosition,zspace.displaySpaceHeadPositionNative);quat.copy(zspace.activeDisplaySpaceHeadOrientation,zspace.displaySpaceHeadOrientationNative)}else{zspace.timeRemainingBeforeTransitionToMono-=timeDeltaMilliseconds;if(zspace.timeRemainingBeforeTransitionToMono<=0){zspace.timeRemainingBeforeTransitionToMono=0;zspace.autoStereoState=AutoStereoState.AnimatingToMono;var startDisplaySpaceHeadPosition=vec3.clone(zspace.displaySpaceHeadPositionNative);var startDisplaySpaceHeadOrientation=quat.clone(zspace.displaySpaceHeadOrientationNative);var startIPD=zspace.IPD;var autoStereoTween=new Tween(zspace.autoStereoTransitionDurationMilliseconds);autoStereoTween.onUpdate=function(tween){updateAutoStereoActiveValuesForAnimation(zspace,tween.normalizedTime,startDisplaySpaceHeadPosition,zspace.defaultDisplaySpaceHeadPosition,startDisplaySpaceHeadOrientation,zspace.defaultDisplaySpaceHeadOrientation,startIPD,0)};autoStereoTween.onComplete=function(){zspace.autoStereoState=AutoStereoState.IdleMono;zspace.autoStereoTween=null};autoStereoTween.easeType=TweenEaseType.EaseOutQuad;zspace.autoStereoTween=autoStereoTween}}}function updateAutoStereo(zspace,timeDeltaMilliseconds){switch(zspace.autoStereoState){case AutoStereoState.Initial:updateAutoStereoStateInitial(zspace);break;case AutoStereoState.IdleMono:updateAutoStereoStateIdleMono(zspace);break;case AutoStereoState.IdleStereo:updateAutoStereoStateIdleStereo(zspace,timeDeltaMilliseconds);break}if(zspace.autoStereoTween){zspace.autoStereoTween.update(timeDeltaMilliseconds)}}zspace.prototype.setExternalTextures=function setExternalTextures(leftTexture,rightTexture){this.leftFrameBufferTexture=leftTexture;this.rightFrameBufferTexture=rightTexture;if(leftTexture){this.useExternalTexture=true}else{this.useExternalTexture=false}};zspace.prototype.setViewerScale=function setViewerScale(scale){this.viewerScale=scale;mat4.identity(this.viewerScaleMatrix);var scale=vec3.create();scale[0]=this.viewerScale;scale[1]=this.viewerScale;scale[2]=this.viewerScale;mat4.scale(this.viewerScaleMatrix,this.viewerScaleMatrix,scale)};zspace.prototype.setFarClip=function setFarClip(clip){this.farClip=clip};zspace.prototype.setNearClip=function setNearClip(clip){this.nearClip=clip};zspace.prototype.setBrowserViewportOffset=function setBrowserViewportOffset(x,y){if(this.browserViewportOffset===null){this.browserViewportOffset=[x,y]}else{this.browserViewportOffset[0]=x;this.browserViewportOffset[1]=y}};zspace.prototype.vibrateStylus=function vibrateStylus(intensity,duration){if(this.stylusGamepad&&this.stylusGamepad.haptics&&this.stylusGamepad.haptics[0]){this.stylusGamepad.haptics[0].vibrate(intensity,duration)}};zspace.prototype.zspaceInit=function zspaceInit(){if(navigator.getVRDisplays){navigator.getVRDisplays().then((function(displays){if(displays.length>0){var i;for(i=0;i<displays.length;i++){if(displays[i].displayName=="ZSpace Display"){displayDevice=displays[i]}if(displays[i].displayName=="ZSpace Stylus"){stylusDevice=displays[i]}if(displays[i].displayName=="ZSpace Stylus Buttons"){stylusButtonsDevice=displays[i]}}}}))}if(this.browserViewportOffset===null){this.browserViewportOffset=computeBrowserViewportOffsetUsingHeuristic()}var me=this;window.addEventListener("vrdisplaypresentchange",(function(){onVRPresentChange(me)}),false);window.addEventListener("vrdisplayactivate",(function(e){onVRRequestPresent(e,me)}),false);window.addEventListener("vrdisplaydeactivate",(function(){onVRExitPresent(me)}),false);window.addEventListener("keydown",(function(e){keyEvent(e,me)}),false);window.addEventListener("mousemove",(function(e){mouseEvent(e,me)}),false)};zspace.prototype.allocateBuffers=function allocateBuffers(){if(this.leftFrameBuffer==null){this.leftFrameBuffer=this.gl.createFramebuffer();this.rightFrameBuffer=this.gl.createFramebuffer()}if(this.leftRenderBuffer!=null){this.gl.deleteRenderbuffer(this.leftRenderBuffer);this.gl.deleteRenderbuffer(this.rightRenderBuffer);this.leftRenderBuffer=null;this.rightRenderBuffer=null}if(this.leftRenderBuffer==null){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.leftFrameBuffer);this.leftRenderBuffer=this.gl.createRenderbuffer();this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.leftRenderBuffer);this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,this.canvas.clientWidth,this.canvas.clientHeight);this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.leftRenderBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null);this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.rightFrameBuffer);this.rightRenderBuffer=this.gl.createRenderbuffer();this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.rightRenderBuffer);this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,this.canvas.clientWidth,this.canvas.clientHeight);this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.rightRenderBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null)}this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.leftFrameBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.leftRenderBuffer);if(this.leftFrameBufferTexture!=null){this.gl.deleteTexture(this.leftFrameBufferTexture)}this.leftFrameBufferTexture=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,this.leftFrameBufferTexture);this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR);this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.canvas.clientWidth,this.canvas.clientHeight,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,null);this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.leftFrameBufferTexture,0);this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.rightFrameBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.rightRenderBuffer);if(this.rightFrameBufferTexture!=null){this.gl.deleteTexture(this.rightFrameBufferTexture)}this.rightFrameBufferTexture=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,this.rightFrameBufferTexture);this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR);this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.canvas.clientWidth,this.canvas.clientHeight,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,null);this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.rightFrameBufferTexture,0);this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null)};zspace.prototype.zspaceLeftView=function zspaceLeftView(){if(!this.stereoEnable)return;if(!this.useExternalTexture){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.leftFrameBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.leftRenderBuffer)}};zspace.prototype.zspaceRightView=function zspaceRightView(){if(!this.stereoEnable)return;if(!this.useExternalTexture){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.rightFrameBuffer);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.rightRenderBuffer)}};zspace.prototype.zspaceFrameEnd=function zspaceFrameEnd(){if(!this.stereoEnable)return;this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null);this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null);if(this.presenting){displayDevice.submitFrame()}};zspace.prototype.makeProjection=function makeProjection(projection,eye){var nearScale=this.nearClip/eye[2];var bounds=[0,0,0,0,0,0];var l=(-this.viewportHalfWidth-eye[0])*nearScale;var r=(this.viewportHalfWidth-eye[0])*nearScale;var b=(-this.viewportHalfHeight-eye[1])*nearScale;var t=(this.viewportHalfHeight-eye[1])*nearScale;var n=this.nearClip;var f=this.farClip;projection[0]=2*n/(r-l);projection[4]=0;projection[8]=(l+r)/(r-l);projection[12]=0;projection[1]=0;projection[5]=2*n/(t-b);projection[9]=(t+b)/(t-b);projection[13]=0;projection[2]=0;projection[6]=0;projection[10]=(f+n)/(n-f);projection[14]=2*n*f/(n-f);projection[3]=0;projection[7]=0;projection[11]=-1;projection[15]=0};zspace.prototype.zspaceUpdate=function zspaceUpdate(){this.frameCount+=1;var currentTime=performance.now();var timeDelta=currentTime-this.lastUpdateTime;this.displaySize=[.521,.293];this.displayResolution=[1920,1080];this.displayScaleFactor[0]=this.displaySize[0]/this.displayResolution[0];this.displayScaleFactor[1]=this.displaySize[1]/this.displayResolution[1];if(this.canvasSize[0]!=this.canvas.clientWidth||this.canvasSize[1]!=this.canvas.clientHeight){this.canvasSize[0]=this.canvas.clientWidth;this.canvasSize[1]=this.canvas.clientHeight;if(!this.useExternalTexture){this.allocateBuffers()}}if(displayDevice!=null){if(this.swapStereo){displayDevice.requestPresent([{source:this.canvas,stereoTextures:[this.rightFrameBufferTexture,this.leftFrameBufferTexture]}])}else{displayDevice.requestPresent([{source:this.canvas,stereoTextures:[this.leftFrameBufferTexture,this.rightFrameBufferTexture]}])}}updateCanvasPosition(this);var canvasWidth=this.canvas.clientWidth*this.displayScaleFactor[0]*this.viewerScale;var canvasHeight=this.canvas.clientHeight*this.displayScaleFactor[1]*this.viewerScale;this.cameraSpaceCanvasSize[0]=canvasWidth;this.cameraSpaceCanvasSize[1]=canvasHeight;var displayCenterX=this.displayResolution[0]*.5;var displayCenterY=this.displayResolution[1]*.5;var viewportCenterX=this.canvasPosition[0]+this.canvas.clientWidth*.5;var viewportCenterY=this.displayResolution[1]-(this.canvasPosition[1]+this.canvas.clientHeight*.5);this.viewportHalfWidth=this.canvas.clientWidth*this.displayScaleFactor[0]*.5;this.viewportHalfHeight=this.canvas.clientHeight*this.displayScaleFactor[1]*.5;var viewportShift=[0,0,0];viewportShift[0]=(viewportCenterX-displayCenterX)*this.displayScaleFactor[0];viewportShift[1]=(viewportCenterY-displayCenterY)*this.displayScaleFactor[1];var viewportToDisplayMatrix=mat4.create();mat4.identity(viewportToDisplayMatrix);mat4.translate(viewportToDisplayMatrix,viewportToDisplayMatrix,viewportShift);var displayToViewportMatrix=mat4.clone(viewportToDisplayMatrix);displayToViewportMatrix[12]=-displayToViewportMatrix[12];displayToViewportMatrix[13]=-displayToViewportMatrix[13];var frameData;if(displayDevice&&displayDevice.isPresenting){this.renderStereo=true;frameData=new VRFrameData;displayDevice.getFrameData(frameData);this.displayAngle[0]=frameData.rightProjectionMatrix[0];this.displayAngle[1]=frameData.rightProjectionMatrix[1];this.displayAngle[2]=frameData.rightProjectionMatrix[2];mat4.set(this.cameraToDisplayMatrixNative,frameData.leftProjectionMatrix[0],frameData.leftProjectionMatrix[1],frameData.leftProjectionMatrix[2],frameData.leftProjectionMatrix[3],frameData.leftProjectionMatrix[4],frameData.leftProjectionMatrix[5],frameData.leftProjectionMatrix[6],frameData.leftProjectionMatrix[7],frameData.leftProjectionMatrix[8],frameData.leftProjectionMatrix[9],frameData.leftProjectionMatrix[10],frameData.leftProjectionMatrix[11],frameData.leftProjectionMatrix[12],frameData.leftProjectionMatrix[13],frameData.leftProjectionMatrix[14],frameData.leftProjectionMatrix[15]);var displayAngle=this.usePortalModeAngle?this.displayAngle:this.customDisplayAngle;computeCameraSpaceToViewportSpaceMatrix(this.cameraToViewportMatrix,displayAngle,this.cameraOffset,this.viewerScale);mat4.multiply(this.cameraToDisplayMatrix,viewportToDisplayMatrix,this.cameraToViewportMatrix);mat4.invert(this.displayToCameraMatrix,this.cameraToDisplayMatrix);vec3.copy(this.displaySpaceHeadPositionNative,frameData.pose.position);quat.copy(this.displaySpaceHeadOrientationNative,frameData.pose.orientation);updateAutoStereo(this,timeDelta);var leftEye=vec3.create();var leftEyeDisplay=vec3.create();var centerEyeDisplay=vec3.create();var centerEyeViewport=vec3.create();mat4.fromRotationTranslation(this.displaySpaceHeadPose,this.activeDisplaySpaceHeadOrientation,this.activeDisplaySpaceHeadPosition);var displaySpaceHeadZAxis=vec3.create();displaySpaceHeadZAxis[0]=this.displaySpaceHeadPose[8];displaySpaceHeadZAxis[1]=this.displaySpaceHeadPose[9];displaySpaceHeadZAxis[2]=this.displaySpaceHeadPose[10];vec3.scaleAndAdd(centerEyeDisplay,this.activeDisplaySpaceHeadPosition,displaySpaceHeadZAxis,this.glassesOffset);var eyePoseMatrix=mat4.create();mat4.fromRotationTranslation(eyePoseMatrix,this.activeDisplaySpaceHeadOrientation,centerEyeDisplay);centerEyeViewport[0]=centerEyeDisplay[0]+displayToViewportMatrix[12];centerEyeViewport[1]=centerEyeDisplay[1]+displayToViewportMatrix[13];centerEyeViewport[2]=centerEyeDisplay[2]+displayToViewportMatrix[14];mat4.fromRotationTranslation(this.viewportSpaceHeadPose,this.activeDisplaySpaceHeadOrientation,centerEyeViewport);var xAxis=vec3.create();xAxis[0]=eyePoseMatrix[0];xAxis[1]=eyePoseMatrix[1];xAxis[2]=eyePoseMatrix[2];vec3.scaleAndAdd(leftEyeDisplay,centerEyeDisplay,xAxis,-this.activeIPD/2);vec3.transformMat4(leftEye,leftEyeDisplay,displayToViewportMatrix);computeEyeViewMatrix(this.leftViewMatrix,leftEye,this.cameraToViewportMatrix);this.makeProjection(this.leftProjectionMatrix,leftEye);var rightEye=vec3.create();var rightEyeDisplay=vec3.create();vec3.scaleAndAdd(rightEyeDisplay,centerEyeDisplay,xAxis,this.activeIPD/2);vec3.transformMat4(rightEye,rightEyeDisplay,displayToViewportMatrix);computeEyeViewMatrix(this.rightViewMatrix,rightEye,this.cameraToViewportMatrix);this.makeProjection(this.rightProjectionMatrix,rightEye);mat4.invert(this.cameraSpaceCanvasPose,this.cameraToViewportMatrix);var viewerScaleVec=vec3.fromValues(1/this.viewerScale,1/this.viewerScale,1/this.viewerScale);mat4.scale(this.cameraSpaceCanvasPose,this.cameraSpaceCanvasPose,viewerScaleVec)}else{this.renderStereo=false;this.displayAngle[0]=this.customDisplayAngle[0];this.displayAngle[1]=this.customDisplayAngle[1];this.displayAngle[2]=this.customDisplayAngle[2];mat4.identity(this.cameraToDisplayMatrixNative);computeCameraSpaceToViewportSpaceMatrix(this.cameraToViewportMatrix,this.customDisplayAngle,this.cameraOffset,this.viewerScale);mat4.multiply(this.cameraToDisplayMatrix,viewportToDisplayMatrix,this.cameraToViewportMatrix);mat4.invert(this.displayToCameraMatrix,this.cameraToDisplayMatrix);var centerEyeDisplay=vec3.create();var centerEyeViewport=vec3.create();var displaySpaceHeadPosition;displaySpaceHeadPosition=this.defaultDisplaySpaceHeadPosition;mat4.fromTranslation(this.displaySpaceHeadPose,displaySpaceHeadPosition);var displaySpaceHeadZAxis=vec3.create();displaySpaceHeadZAxis[0]=this.displaySpaceHeadPose[8];displaySpaceHeadZAxis[1]=this.displaySpaceHeadPose[9];displaySpaceHeadZAxis[2]=this.displaySpaceHeadPose[10];vec3.scaleAndAdd(centerEyeDisplay,displaySpaceHeadPosition,displaySpaceHeadZAxis,this.glassesOffset);var eyePoseMatrix=mat4.create();mat4.fromTranslation(eyePoseMatrix,centerEyeDisplay);centerEyeViewport[0]=centerEyeDisplay[0]+displayToViewportMatrix[12];centerEyeViewport[1]=centerEyeDisplay[1]+displayToViewportMatrix[13];centerEyeViewport[2]=centerEyeDisplay[2]+displayToViewportMatrix[14];mat4.fromTranslation(this.viewportSpaceHeadPose,centerEyeViewport);computeEyeViewMatrix(this.centerViewMatrix,centerEyeViewport,this.cameraToViewportMatrix);this.makeProjection(this.centerProjectionMatrix,centerEyeViewport);mat4.invert(this.cameraSpaceCanvasPose,this.cameraToViewportMatrix);var viewerScaleVec=vec3.fromValues(1/this.viewerScale,1/this.viewerScale,1/this.viewerScale);mat4.scale(this.cameraSpaceCanvasPose,this.cameraSpaceCanvasPose,viewerScaleVec)}var stylusPose=null;if(stylusDevice&&displayDevice&&displayDevice.isPresenting){frameData=new VRFrameData;stylusDevice.getFrameData(frameData);stylusPose=frameData.pose}if(stylusButtonsDevice&&displayDevice&&displayDevice.isPresenting){frameData=new VRFrameData;stylusButtonsDevice.getFrameData(frameData);var stylusButtonsState=frameData.pose;if(stylusButtonsState&&stylusButtonsState.position){this.buttonPressed[0]=stylusButtonsState.position[0];this.buttonPressed[1]=stylusButtonsState.position[1];this.buttonPressed[2]=stylusButtonsState.position[2]}}else{this.buttonPressed[0]=0;this.buttonPressed[1]=0;this.buttonPressed[2]=0}if(displayDevice&&displayDevice.isPresenting){if(stylusPose&&stylusPose.orientation&&stylusPose.position){this.stylusVisible=true;mat4.fromRotationTranslation(this.stylusCameraMatrix,stylusPose.orientation,stylusPose.position);mat4.multiply(this.displaySpaceStylusPose,this.cameraToDisplayMatrixNative,this.stylusCameraMatrix);mat4.multiply(this.stylusCameraMatrix,this.displayToCameraMatrix,this.displaySpaceStylusPose);mat4.multiply(this.viewportSpaceStylusPose,displayToViewportMatrix,this.displaySpaceStylusPose)}else{this.stylusVisible=false}}else{this.stylusVisible=false;mat4.identity(this.stylusCameraMatrix)}this.lastUpdateTime=currentTime};return zspace}();