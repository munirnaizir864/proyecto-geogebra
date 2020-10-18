/*global $, jQuery, GGBT_wsf_view, GGBAppletUtils, console, alert, GGBApplet, renderGGBElement, GGBT_wsf_general*/

window.GGBT_wsf_view = (function ($, general) {
    "use strict";


    var fullscreenContainer = null,
        fullscreenOriginalParent = null,
        noSaveOnUnload = false,
        autosaving = false,
        _isSaving = false,
        defaults,
        appMode = null;

    // tells if the applet is open in fullscreen right now
    var appletIsFullscreen = false;

    if (!general) {
        console.log("general not loaded");
    }

    var ismobile = null,
        mobileAndTabletcheck = function() {
            var check = false;
            (function(a){
                if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
                    check = true;
                }})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        };

    function goBackInHistory() {
        history.back();
    }

    function loadWithAjax(obj) {
        $.get(obj.href)
            .done(function (data) {
                var container,
                    content;
                container = $("body");
                if (obj.contentType === "ws") {
                    if (container.find(">.page").length) {
                        container.find(">.page").remove();
                        console.log("SINGLETON: page removed ");
                    }
                    content = data;
                    container.prepend(content);
                    general.setWorksheet($(".wsf-ws-scroller"));
                    attachEventsToSingleton(container);
                    window.GGBT_gen_singleton.initCreator();
                    window.GGBT_wsf_comments.init();
                } else {
                    container.empty().append(data);
                    window.GGBT_book_general.setCurrentPage(currentPage);
                    window.GGBT_book_general.initBooks($);
                    initBBCode(container);
                }
                window.GGBT_ws_header_footer.init();
            })
            .fail(function (error) {
                console.log(error);
            });
    }
    
    function processLocation(href, type) {

        var isOwnIframe = window.GGBT_gen_singleton.isOwnIFrame();

        switch (type) {
            case "reload":
                if (isOwnIframe) {
                    loadWithAjax(currentPage);
                } else {
                    window.location.reload();
                }
                break;
            case "backurl":
                if (isOwnIframe) {
                   window.GGBT_gen_singleton.closeSingleton();
                } else {
                    window.location.href = href;
                }
        }

    }

    function isFullscreen() {
        return (fullscreenContainer !== null) && (fullscreenContainer.hasClass("fullscreen"));
    }

    function closeFullScreen(e) {
        if (getFullscreenContainer().hasClass("fullscreen"))  {
            e.preventDefault();
            e.stopPropagation();
            if (getFullscreenContainer().find("article").length) {
                toggleAppletFullscreen(false);
            }
        }
    }

    function getFullscreenContainer(addContent) {
        if (fullscreenContainer === null) {
            fullscreenContainer = $('<div id="fullscreencontainer"><a class="active-icon icon-close j-close-fullscreen s-close"></a><div id="fullscreencontent"></div></div>')
                .on("click", function (e) {
                    if (e.currentTarget === e.target) {
                        goBackInHistory();
                        if (fullscreenContainer.find("article").length) {
                            toggleAppletFullscreen(false);
                        }
                    }
                })
                .appendTo("body");
            $(document).on("keydown", function (e) {
                function checkIfFullscreenCanbeClosed() {
                    return (e.keyCode === 27 || e.keyCode === 8) &&
                        getFullscreenContainer().hasClass("fullscreen") &&
                        !/CANVAS|INPUT|TEXTAREA/.test(e.target.nodeName);
                }

                if (checkIfFullscreenCanbeClosed()) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (getFullscreenContainer().find("article").length) {
                        toggleAppletFullscreen(false);
                    }
                    goBackInHistory();
                }
            });
            $('.j-close-fullscreen').on('click', function(e) {
                if (getFullscreenContainer().hasClass("fullscreen"))  {
                    e.preventDefault();
                    e.stopPropagation();
                    if (getFullscreenContainer().find("article").length) {
                        toggleAppletFullscreen(false);
                    }
                    goBackInHistory();
                }
            });
            [
                "webkit",
                "moz",
                ""
            ].forEach(function(prefix) {
                document["on" + prefix + "fullscreenchange"] = function(e) {
                    [
                        "fullscreenElement",
                        "webkitFullscreenElement",
                        "mozFullScreenElement"
                    ].forEach(function(fse) {
                        if (document[fse] !== undefined && document[fse] !== null) {
                            console.log("FULLSCREEN!");
                        } else if (document[fse] === null) {
                            console.log("NOT FULLSCREEN!")
                            toggleAppletFullscreen(false);
                        }
                    });
                };
            });
        }

        if (addContent && $('#fullscreencontent').length === 0) {
            fullscreenContainer.append('<div id="fullscreencontent"></div>');
        }

        return fullscreenContainer;
    }

    function initWsfTeacherInfoButton(worksheet) {
        var button = $(".wsf-teacher-info-button");
        button.off("click").on("click", function (e) {
            e.preventDefault();
            general.initTeacherInfoPage($(this));
        });
    }

    function initWsfElementInfoButton(worksheet) {
        var buttons = $(".wsf-element-info-button");
        buttons.off("click").on("click", function (e) {
            e.preventDefault();
            var parent = $(this).parents(".worksheet_element");
            general.setWsfActiveContent(parent);
            general.initElementInfoPage($(this));
        });
    }

    /**
     * This function chooses a good position for the close X
     * It is positioned either on top or to the right/left (for ltr/rtl)
     * Depending on where there is more space
     * @param appletElem
     */
    var closePosition = null;
    function setCloseBtnPosition(appletElem) {
        var article = $(appletElem);
        var container = article.parents('#fullscreencontainer');

        if(container.length <= 0) {
            return;
        }

        var width = 0,
            height = 0,
            owidth = article.find('article').attr('data-param-width'),
            oheight = article.find('article').attr('data-param-height'),
            wwidth = $(window).width(),
            wheight = $(window).height();

        //console.log('++++++++++++++ SET CLOSE BTN POSITION ++++++++++++++++');
        //console.log('window width: ' + wwidth + ', applet owidth: ' + owidth + ', applet width: ' + width);
        //console.log('window height: ' + wheight + ', applet oheight: ' + oheight + ', applet height: ' + height);

        width = wwidth;
        var scale = wwidth / owidth;
        height = oheight * scale;

        if(height > wheight) {
            scale = wheight / oheight;
            height = wheight;
            width = owidth * scale;
        }

        //console.log('window width: ' + wwidth + ', applet owidth: ' + owidth + ', applet width: ' + width);
        //console.log('window height: ' + wheight + ', applet oheight: ' + oheight + ', applet height: ' + height);

        // check whether there is more space on top or to the right/left for the close X
        if((wwidth - width) > (wheight - height)) {
            // position to the right/left
            closePosition = 'closePositionRight';
            // remove topposition
            if(container.hasClass('closePositionTop')) {
                container.removeClass('closePositionTop');
            }
        } else {
            // position on top
            closePosition = 'closePositionTop';
            // remove right/left position
            if(container.hasClass('closePositionRight')) {
                container.removeClass('closePositionRight');
            }
        }

        // only add position if it doesn't exist yet
        if(!container.hasClass(closePosition)) {
            container.addClass(closePosition);
        }
    }

    function getCloseBtnPosition() {
        return closePosition;
    }

    function applyScaleToApplet(applet_container) {
        applet_container.appendTo(getFullscreenContainer().find("#fullscreencontent").empty());

        getFullscreenContainer().addClass("fullscreen");
        appletIsFullscreen = true;
        history.pushState({page: 1}, "pdf");
    }

    function toggleAppletFullscreen(button) {
        var applet_container,
            article;
        if (button) {
            // not used right now, so it doesn't really matter what is here
            // if it going to be used again make sure you use the scale functionality in deployggb.js
            // @Steffi, yes it is used, as we have fullscreen button if not playbutton present

            // @Steffi I do not like this either, but something clears out classnames from body if called "recalculateEnvironment"
            $('body').css("overflow", "hidden");



            fullscreenOriginalParent = button.parents(".worksheet_element");
            applet_container = fullscreenOriginalParent.find(".applet_container");
            //width = parseInt(article.attr("data-param-width"), 10) + 20; //margin
            //height = parseInt(article.attr("data-param-height"), 10) + 20; //margin
            applyScaleToApplet(applet_container);
        } else {
            applet_container = getFullscreenContainer().find('.applet_container');
            getFullscreenContainer().removeClass("fullscreen");

            // Move the applet to the original parent (is done in deployggb.js)
            if (applet_container.length === 0) {
                var content = $('#fullscreencontent');
                var applet_id = content.attr("data-applet-id");
                var material_id = content.attr("data-material-id");
                var applet = general.getGGBAppletFromId(applet_id);
                content = content.addClass("fullscreencontent").hide().get(0);
                if (content !== undefined) {
                    content.removeAttribute("id");
                    var oriContainer = $('#applet_container_'+material_id)[0];
                    applet.onExitFullscreen(content, oriContainer);
                }
            }

            // @Steffi I do not like this either, but something clears out classnames from body if called "recalculateEnvironment"
            appletIsFullscreen = false;
            exitFullScreen();

            if (fullscreenOriginalParent) {
                applet_container.appendTo(fullscreenOriginalParent.find(".ws-element-applet").empty());
                $(".applet_container").css({left: "auto", top : "auto"}); //to hack out positionCenter problems @steffi
                fullscreenOriginalParent = null;
            }
        }

        article = applet_container.find("article").removeAttr("data-scalex").removeAttr("data-scaley");
        if (window[article.attr("data-param-id")] && fullscreenOriginalParent) {
            window[article.attr("data-param-id")].recalculateEnvironments();
        }

        $(window).resize();
    }

    /**
     * Launch fullscreen for browsers that support it!
     * launchFullScreen(document.documentElement); // the whole page
     * launchFullScreen(document.getElementById("videoElement")); // any individual element
     * @param element
     */
    // Find the right method, call on correct element
    function launchFullScreen(element) {
        if(element.requestFullScreen) {
            element.requestFullScreen();
        } else if(element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if(element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen();
        } else if(element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        $('body').addClass('noscroll');
    }

    function exitFullScreen() {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        $('body').removeClass('noscroll');
        $('body').css("overflow", "auto");
    }

    function isFullscreen() {
        return appletIsFullscreen;
    }

    function renderFullScreen(applet_container, applet_id) {
        history.pushState({page: 1}, "pdf");
        $('body').addClass('noscroll');
        appletIsFullscreen = true;
        var container = getFullscreenContainer(true);
        var material_id = $(applet_container).attr("id").substr(17);
        var content = container.find("#fullscreencontent").empty();
        container.addClass("fullscreen");
        content.attr("data-applet-id", applet_id).attr("data-material-id", material_id);

        var parent = $(applet_container).parents(".worksheet_element");
        if (parent.length) {
            content.attr("data-element-type", parent.data("type"));
        }
        return content.get(0);
    }

    function initWsfFullscreenButton(worksheet) {
        var buttons = worksheet.find(".wsf-element-fullscreen-button");
        buttons.off("click").on("click", function (e) {
            e.preventDefault();
            toggleAppletFullscreen($(this));
        });
    }

    function initWsfPdfFullscreenButton(worksheet) {
        var buttons = worksheet.find(".ws-element-pdf:not([data-download]) .wsf-pdf-popup");
        buttons.off("click").on("click", function(e) {
            e.preventDefault();
            var title = $(this).parents('.wsf-content-added').find('.ws-element-title h5').text();
            window.GGBT_gen_modal.showPdfPopup($(this).attr("href"), title);
        });
    }

    function initWsfButtonInformation(worksheet) {
        var button = general.getButtonInfoClose();
        button.off("click").on("click", function (e) {
            general.closeInfoFromView();
            e.preventDefault();
        });
    }

    function isSaving() {
        return _isSaving || (appMode === "google.classroom" && window.GGBT_google_classroom.isSubmitInProgress());
    }

    function saveOnUnload(autosave, clb) {

        // Save task data
        if (isTaskSavable() && isExerciseModified() && !isSaving() && !inBook()) {
            autosaving = autosave;
            if (window.GGBT_gen_edit.getSaveState() !== window.GGBT_gen_edit.SAVE_STATE_INPROGRESS) {
                saveUserExamData(false, false, clb || null, autosave);
                window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());
            }
        } else {
            //needed for singleton
            if (clb) {
                clb();
            }
        }
    }

    function inBook() {
        var tools = general.getPage().find('.jWs-tools');
        return (tools.data('inbook') === "1") || (tools.data('inbook') === 1);
    }

    function beforeUnload(autosave, clb) {
        if (!noSaveOnUnload) {
            saveOnUnload(autosave, clb);
        }
    }

    function initSaveExerciseButtons(mode, worksheet) {
        if (!window.GGBT_gen_edit) {
            return;
        }
        window.GGBT_gen_edit.initSaveAndContinue(function (e, button) {
            if (!isSaving() && isTaskSavable()) {
                e.preventDefault();
                saveUserExamData(false, false, function (success) {
                    if (success) {
                        var backURL = window.GGBT_gen_backURL.getBackUrlWithFallback();
                        if (e.target.href) {
                            // if there is a doneUrl set, but it's not attached to the link -> attach it manually.
                            if (backURL) {
                                window.location = e.target.href;
                                return;
                            }

                            noSaveOnUnload = true;
                            window.location = e.target.href;
                        }
                    }
                }, true, button);

                window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());
            }
        }, worksheet.find('.jSave'));

        if (worksheet.find(".ws-element-question").length > 0) {
            window.GGBT_gen_edit.initSave(function (e, sender) {
                if (!isSaving()) {
                    var login = false, tools = general.getPage().find('.jWs-tools');
                    //make selfcheck if not logged in or readonly
                    if (tools.length !== 0) {
                        login = (tools.data('user_id') !== undefined &&
                        tools.data('user_id') > 0 && !inBook()) ? true : false;
                    }
                    if (login && isTaskSavable()) {
                        saveUserExamData(true, false, function done(success) {
                            if (success) {
                                noSaveOnUnload = true;
                                processLocation(null, "reload");
                            }
                        });
                    } else {
                        markAnswers(sender);
                        general.getPage().find('.jDone').hide();
                        general.getPage().find('.jRestart').show();
                    }
                }
            }, worksheet.find('.jDone'));
        } else {
            worksheet.find('.jDone').hide();
        }

        window.GGBT_gen_edit.initSaveAndClose(function (e) {
            e.preventDefault();

            var successFct = function (success) {
                if (success) {
                    noSaveOnUnload = true;
                    if (appMode === "google.classroom" && worksheet.find('.jSave').hasClass("inactive")) {
                        window.close();
                    } else {
                        var backURL = window.GGBT_gen_backURL.getBackUrlWithFallback();
                        if (e.target.href) {
                            // if there is a doneUrl set, but it's not attached to the link -> attach it manually.
                            if (backURL) {
                                window.location = e.target.href;
                                return;
                            }

                            window.location = e.target.href;
                        } else if (backURL){
                            processLocation(backURL, "backurl");
                        } else {
                            window.close();
                        }
                    }
                }
            };

            if (!isTaskSavable()) { // Close without saving
                successFct(true);
            } else { // Save and then close
                var button = $(e.currentTarget);

                // Set it to done when the turn in button was clicked
                var setDone = button.hasClass("jTurnIn");

                if (saveUserExamData(setDone, false, successFct, true, button) === false) {
                    // Nothing to save, just close the window
                    successFct(true);
                }
            }

            window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());

        }, worksheet.find('.jSaveAndClose, .jTurnIn'));

        window.GGBT_gen_edit.initSaveAndContinue(function (e, sender) {
            var page = general.getContainerPage(sender);
            if (!inBook()) {
                // worksheet not in book
                hideContentAndShowSpinner();
                saveUserExamData(false, true, function done(success) {
                    if (success) {
                        noSaveOnUnload = true;
                        processLocation(null, "reload");
                    }
                });
            } else {
                // worksheet in a book
                unMarkAnswers(sender);

                page.find('.jDone').show();
                page.find('.jRestart').hide();
            }
        }, worksheet.find('.jRestart'));

        saveAndClose(mode, worksheet);

        worksheet.find('.ws-element-restart-button').click(function () {
            if (!window.confirm($(this).data("confirm"))) {
                return;
            }
            var element = $(this).parents('.worksheet_element');
            var exercise = $('.ws-element-exercise', element);
            var material_id = $(exercise).data("material_id");
            if (window["applet_" + material_id] === undefined) {
                alert("The applet could not be restarted");
                return;
            }
            var applet = window["applet_" + material_id].getAppletObject();
            applet.setBase64(exercise.data("oribase64"));
            setExerciseModified();
            exercise.data('isModified', 'true');
        });

        // Autosave exercise when closing the window
        if (worksheet.find('.jSave').length > 0) {
            $(window).bind("beforeunload", function (e) {
                beforeUnload(false);
            });
        }
    }

    function unMarkAnswers(button) {
        var questionChoices = null;
        var questionAnswers = null;
        if (button) {
            var container = button.parents('.wsf-ws-scroller');
            questionChoices = container.find('.ws-question-choices');
            questionAnswers = container.find('.ws-element-question-answertext');
        } else {
            questionChoices = $('.ws-question-choices');
            questionAnswers = $('.ws-element-question-answertext');
        }
        questionChoices.each(function () {
            removeAnswerOfQuestion($(this));
        });
        questionAnswers.each(function () {
            $(this).find('.ws-open-question-solution').hide();
        });
    }

    function removeAnswerOfQuestion(question) {
        question.find('.ws-question-choice').each(function () {
            //mark right question
            if ($(this).data('ticked') === true) {
                $(this).removeClass("ticked");
            }

            $(this).find('.answer').removeClass("correct");
            $(this).find('.answer').removeClass("incorrect");
            $(this).find('.answer').addClass("placeholder");
            // $(this).find(":input").removeAttr('checked');
        });
    }

    function markAnswers(button) {
        var questionChoices = null;
        var questionAnswers = null;
        if (button) {
            var container = button.parents('.wsf-ws-scroller');
            questionChoices = container.find('.ws-question-choices');
            questionAnswers = container.find('.ws-element-question-answertext');
        } else {
            questionChoices = $('.ws-question-choices');
            questionAnswers = $('.ws-element-question-answertext');
        }
        questionChoices.each(function () {
            markAnswerOfQuestion($(this));
        });
        questionAnswers.each(function () {
            $(this).find('.ws-open-question-solution').show();
        });
    }

    function markAnswerOfQuestion(question) {
        question.find('.ws-question-choice').each(function () {
            //mark right question
            if ($(this).data('ticked') === true) {
                $(this).addClass("ticked");
            }

            //singleChoice Question
            if (question.data('multiple') === 0) {
                if ($(this).find(":input").is(':checked') && $(this).data('ticked') === true) {
                    $(this).find('.answer').addClass("correct");
                    $(this).find('.answer').removeClass("placeholder");
                } else if ($(this).find(":input").is(':checked') && $(this).data('ticked') !== true) {
                    $(this).find('.answer').addClass("incorrect");
                    $(this).find('.answer').removeClass("placeholder");
                }
            } else {
                //multiChoice Question
                //check answer of student
                if (($(this).find(":input").is(':checked') && $(this).data('ticked') === true) ||
                    (!$(this).find(":input").is(':checked') && $(this).data('ticked') !== true)) {
                    $(this).find('.answer').addClass("correct");
                    $(this).find('.answer').removeClass("placeholder");
                } else {
                    $(this).find('.answer').addClass("incorrect");
                    $(this).find('.answer').removeClass("placeholder");
                }
            }
        });
    }

    function initSaveEvalButtons(mode, worksheet) {
        worksheet.find(".wsf-exercise-toolbar").hide();

        if (!window.GGBT_gen_edit) {
            return;
        }
        //save and change the student
        worksheet.find('#student_worksheets').on("change", function (e) {
            //save the evaluation if the status has to be returned (all answers are given)
            //- actually only necessary if there are automatically evaluation questions
            // TODO: Consider that the worksheet object can contain muliple worksheets
            if (worksheet.find('.eval.select').length === worksheet.find('.edit').length) {
                saveEvalData(false, false);
            }

            e.preventDefault();
            $(this).attr('name', $(this).val());
            window.location = $('#student_worksheets').attr('name');
        });

        worksheet.find('.wsf-evaluation-toolbar.edit .eval').on('click', function (e) {
            //check if other symbols are clicked => unclick them
            var page = general.getContainerPage($(this));
            page.find('.wsf-evaluation-toolbar.edit .eval').removeClass('select');
            $(this).addClass('select');

            saveEvalData(false, false, function done(success) {
                //hide or show jReopen Button
                if (page.find('.eval.select').length > 0) {
                    page.find('.button.jReopen').show();
                } else {
                    page.find('.button.jReopen').hide();
                }
            });
        });

        // temporary -> smiley feedback removed!
        worksheet.find('.jReturn').on('click', function (e) {
            var page = general.getContainerPage($(this));
            page.find('.wsf-evaluation-toolbar.edit .eval').removeClass('select');
            page.find('.wsf-evaluation-toolbar.edit .symbol_50').addClass('select');

            saveEvalData(false, true, function done(success) {
                if (success) {
                    page.find('.jIncomplete, .jReturn').hide();
                    page.find('.jReopen').show();
                    nextOrClose();
                }
            });

            window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());
        });
        worksheet.find('.jIncomplete').on('click', function (e) {
            var page = general.getContainerPage($(this));
            // Set the status to 'in progress'. Reopen does that.
            saveEvalData(true, false, function done(success) {
                if (success) {
                    page.find('.jIncomplete, .jReturn').hide();
                    nextOrClose();
                }
            }, true);

            window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());
        });

        function nextOrClose() {
            if ($('.s-student').find('.j-nav-next').hasClass("inactive")) {
                window.location.href = window.GGBT_gen_backURL.getBackUrlWithFallback();
            } else {
                setSaveStateError($('.s-student').find('.j-nav-next').data("next-student-msg"));
                window.location.href = $('.s-student').find('.j-nav-next').attr("href");
            }
        }

        window.GGBT_gen_edit.initSave(function (e, button) {
            var redo = window.confirm(button.data('confirm'));
            if (redo) {
                saveEvalData(true, false, function done(success) {
                    if (success) {
                        processLocation(null, "reload");
                        //$('.button.jReopen').hide();
                    }
                });
            }
        }, worksheet.find('.jReopen'));

        saveAndClose(mode, worksheet);
    }

    function saveAndClose(mode, worksheet) {
        window.GGBT_gen_edit.initSave(function (e) {
            window.GGBT_wsf_comments.saveAllUnsavedComments(general.getWorkSheet());
            if (mode === 'eval') {
                //save the evaluation if the status has to be returned (all answers are given)
                //- actually only necessary if there are automatically evaluation questions
                var toEvaluateLength = $('.edit', general.getPage()).length;
                if (toEvaluateLength > 0 && $('.eval.select', general.getPage()).length === toEvaluateLength) {
                    saveEvalData(false, false, function done(success) {
                        if (success) {
                            windowClose();
                        }
                    });
                } else {
                    windowClose();
                }
            } else if (mode === 'exercise') {
                windowClose(true);
            } else {
                windowClose();
            }

            function windowClose(keep) {
                if (window.opener) {
                    // window.opener.location.reload();
                    window.close();
                } else if (e.target.href && !window.GGBT_gen_singleton.isOwnIFrame()) {
                    window.location = e.target.href;
                } else if ($('.jCancel', general.getPage()).href !== '' && !window.GGBT_gen_singleton.isOwnIFrame()) {
                    window.location = $('.jCancel', general.getPage()).get(0).href;
                } else if (window.GGBT_gen_singleton.isOwnIFrame()) {
                  window.GGBT_gen_singleton.closeSingleton(keep);
                }
            }
        }, worksheet.find('.jCancel'));
    }

    function getUserExamData(setDone, reset, worksheet) {
        var data = {elements: []};
        //self-evaluation-mode: setDone = true (done/show) false (restart)
        //student-mode: setDone is calculated
        var isCompleted = true;

        //get answers of questions
        if ($('.ws-element-question', worksheet).length) {
            $('.ws-element-question', worksheet).each(function (idx, question) {
                var questionData = getQuestionData(question);
                data.elements.push(questionData);
                if (questionData.data.answers.length === 0) {
                    isCompleted = false;
                }
            });
        }

        //get geogebra tasks
        if ($('.ws-element-exercise', worksheet).length) {
            $('.ws-element-exercise', worksheet).each(function (idx, exercise) {
                var exerciseData = getExerciseData(exercise),
                    ex = $(exercise),
                    oriBase64 = ex.data("oribase64");
                if ((ex.attr("data-autocheck") !== "true" || ex.attr("data-is-graded") !== "true")) {
                    isCompleted = false;
                }

                if (reset || $(this).data("isModified") === "true" || setDone === true) {
                    data.elements.push(exerciseData);
                }
            });
        }

        if (setDone === true) {
            data.markAsDone = true;
        } else {
            data.markAsDone = false;
        }

        data.markAsGraded = (setDone && isCompleted);

        if (reset === true) {
            data.reset = true;
        }

        return data;
    }

    function getQuestionData(question) {
        var data = {id: $(question).data("id"), data: {hasData: true}};
        var choices = $('.ws-question-choice', question);
        //single or multichoice answers
        if (choices.length) {
            data.data.answers = [];
            $('input:checked', choices).each(function (idx, choice) {
                data.data.answers.push($(choice).data("id"));
            });
            data.data.type = "tf";
            //open answers
        } else {
            data.data.answers = $('.ws-element-question-answertext textarea', question).val();
            data.data.type = "txt";
        }
        if (data.data.answers.length === 0) {
            data.data.hasData = false;
        }
        return data;
    }

    function getExerciseData(exercise) {
        var data = {id: $(exercise).data("id"), data: {hasData: true}};
        var material_id = $(exercise).data("material_id");
        if (window["applet_" + material_id] === undefined) {
            return data;
        }
        var applet = window["applet_" + material_id].getAppletObject();
        if (typeof applet === "object") {
            var ggb64 = applet.getBase64(null, true);
            if ($('article', exercise).data("param-ggbbase64") !== ggb64) {
                data.data.ggb64 = ggb64;
            }
        }
        return data;
    }

    function saveUserExamData(setDone, reset, done, async, button) {
        var url;
        setSaveStateInProgress();
        var worksheet = general.getPage();
        if (async === null || async === undefined) {
            async = true;
        }

        var data = getUserExamData(setDone, reset, worksheet);

        if (appMode === "google.classroom") {
            url = window.GGBT_google_classroom.onSaveExerciseStart(data, button);
        } else {
            url = $('.jWs-tools', worksheet).data('saveurl');
        }

        if (data.elements.length === 0) {
            // No changes to save
            if (appMode === "google.classroom") {
                window.GGBT_google_classroom.onSaveExerciseDone(data.token, button);
            } else {
                setExerciseModified(false);
                setSaveStateSuccessful();
            }
            return false;
        }

        var fail = function (msg) {
            setSaveStateError(msg);
            if (typeof done === "function") {
                done(false);
            }
        };

        $.ajax({
            type: "POST",
            url: url,
            data: {data: data},
            async: async
        }).done(function (result) {
            if (result.type === "success") {
                setExerciseModified(false);
                worksheet.find('.ws-element-exercise').data("isModified", false);
                if (appMode === "google.classroom") {
                    window.GGBT_google_classroom.onSaveExerciseDone(data.token, button);
                } else {
                    setSaveStateSuccessful();
                    if (typeof done === "function") {
                        done(true);
                    }
                }
            } else {
                fail(result.message);
            }
        }).fail(function (result) {
            fail(result.responseText);
        });


        return true;
    }

    function saveEvalData(reopen, setToComplete, done) {
        setSaveStateInProgress();
        var page = general.getPage();
        var user_id = false;
        if ($('.jStudent', page).length !== 0) {
            user_id = $('.jStudent', page).data('exercise-student');
        } else {
            //delete after new header is invented
            user_id = $('.wsf-worksheet-title', page).data('exercise-student');
        }
        var data = {user_id: user_id, markAsGraded: false, markAsDone: false, elements: []};
        //set done-date or delete done-date of all elements
        $('.wsf-evaluation-toolbar', page).each(function () {
            var mat_eval = {id: $(this).parents(".worksheet_element").data('mat-id'), data: {hasData: true}},
                mat_click = $(this).find('.select');
            if ($(mat_click).length > 0 && typeof $(mat_click).data('points') !== 'undefined') {
                mat_eval.points = $(mat_click).data('points');
            } else {
                mat_eval.points = null;
            }
            data.elements.push(mat_eval);
        });
        if (setToComplete) {
            data.markAsGraded = true;
        } else if (reopen) {
            data.markAsDone = false;
            data.markAsGraded = false;
            data.reset = true;
        }

        var fail = function (msg) {
            setSaveStateError(msg);
            if (done !== undefined) {
                done(false);
            }
        };

        var url = false;
        if ($('.jWs-tools', page).length !== 0) {
            url = $('.jWs-tools', page).data('saveurl');
        } else {
            //delete after new header is invented
            url = $('.save-wrapper', page).data('saveurl');
        }

        $.post(url, {data: data}).done(function (result) {
            if (result.type === "success") {
                setSaveStateSuccessful();
                if (done !== undefined) {
                    if (result.newData) {
                        $('.student-state .j-feedback-state-name', page).text($('.student-state', page).data(result.newData));
                        if (result.newData === "complete") {
                            $('.student-state .icon', page).removeClass('icon-status-incomplete').removeClass('icon-status-not_started');
                            $('.student-state .icon', page).addClass('icon-status-complete');
                        }
                    }
                    done(true);
                }
            } else {
                fail(result.message);
            }
        }).fail(function (result) {
            fail(result.responseText);
        });
    }

    function autoSaveMessage(msg) {
        var button = $(".header-link.jSave");
        // Show the button on first change of status
        if (button.data("visible")) {
            button.show();
        }
        if (msg === "save_inprogress") {
            button.text(button.data(msg));
        } else {
            button.animate({"opacity" : 0.0},300, function() {
                button.text(button.data(msg)).animate({"opacity": 1}, 300);
            });
        }
    }

    var autoSavetimer = null;
    function initAutoSave() {

        // Use autosave only in exercise mode
        var mode = $(general.getWorkSheet().get(0)).data('mode');
        if (mode !== "eval") {
            autoSavetimer = window.setInterval(function () {
                saveOnUnload(true);
            }, 3000);
        }
    }

    function restartAutoSaveTimer() {
        if (autoSavetimer !== null) {
            window.clearTimeout(autoSavetimer);
            autoSavetimer = null;
        }
        initAutoSave();
    }

    function initButtons(worksheet) {
        var singleWorksheet = worksheet;
        if (worksheet === undefined) {
            worksheet = $('body'); // Init buttons for all worksheets
            singleWorksheet = $(general.getWorkSheet());
        } else if (worksheet.has('.wsf-ws-scroller').length > 0) {
            singleWorksheet = $('.wsf-ws-scroller', worksheet);
        }

        initWsfTeacherInfoButton(worksheet);
        initWsfElementInfoButton(worksheet);
        initWsfButtonInformation(worksheet);
        initWsfFullscreenButton(worksheet);
        initWsfPdfFullscreenButton(worksheet);



        var mode = singleWorksheet.data('mode');
        if (mode === "eval") {
            initSaveEvalButtons(mode, worksheet);
        } else if (mode === "task" || window.GGBT_book_general) {
            initSaveExerciseButtons(mode, worksheet);
        }

        initToolBar();

        // Init play button
        if (Math.max(screen.width,screen.height) < 800 && defaults.useplaybutton) {
            singleWorksheet.addClass("useplaybuttons");
        }
    }

    function initQuestionElements() {
        //elastic Textarea
        jQuery.fn.elasticArea = function () {
            return this.each(function () {
                function resizeTextarea(textarea) {
                    textarea.style.height = textarea.scrollHeight / 2 + 'px';

                    var height = Math.max(textarea.scrollHeight, 60);
                    textarea.style.height = height + 'px';
                }

                $(this).keypress(function (e) {
                    resizeTextarea(e.target);
                })
                    .keydown(function (e) {
                        resizeTextarea(e.target);
                    })
                    .keyup(function (e) {
                        resizeTextarea(e.target);
                    })
                    .css('overflow', 'hidden');
                resizeTextarea(this);
            });
        };

        $('.ws-element-question-answertext textarea').elasticArea();

        $('.ws-element-question input, .ws-element-question textarea').change(function() {
            setExerciseModified();
        });
        $('.ws-element-question textarea').keydown(function() {
            setExerciseModified();
        });

        $('[data-bbcodeinput="true"]').each(function() {
            window.GGBT_texthandlers.initBBCodeEditor($(this), {
                defaults : defaults,
                customKeyDown: function(t) {
                    setExerciseModified();
                    t.sync();
                },
                modalClosed: function(t) {
                    setExerciseModified();
                    t.sync();
                }
            });
            $(this).sync();
        });
    }

    var exerciseIsModified = false;

    function setExerciseModified(modified) {
       exerciseIsModified = (modified === undefined);
    }

    function isExerciseModified() {
        return exerciseIsModified;
    }

    function initVideos(worksheet) {
        if (worksheet === undefined || worksheet === null) {
            $(".wsf-ws-scroller").each(function() {
                initVideos($(this));
            });
        } else {
            worksheet.find('.youtube-player').each(function() {
                $(this).get(0).addEventListener("onPlayerReady", function(e) {
                    console.log("video ready");
                    console.log(e.target);
                });
            });
        }
    }

    function initWebElements(worksheet) {
        var elements;
        if (worksheet === undefined || worksheet === null) {
            elements = $('.jModal');
        } else {
            elements = worksheet.find('.jModal');
        }
        elements.each(function() {
            GGBT_wsf_general.initWebElement($(this));
        });
        elements.click(function () {
            var modal = $(this),
                width = modal.data('width'),
                height = modal.data('height'),
                src = modal.data('src'),
                title = modal.data('title');
            if (title.length === 0) {
                title = src;
            }


            var bookMenu = $('#menu-container'), onClose = null;
            if (bookMenu.length === 1) {
                var zIndex = bookMenu.css("z-index");
                bookMenu.css("z-index", 1000);
                bookMenu.find('#menu').css("z-index", 1000);
                onClose = function() {
                    bookMenu.css("z-index", zIndex);
                    bookMenu.find('#menu').css("z-index", zIndex);
                };
            }

            window.GGBT_gen_modal.showIframePopup(src, {overlayClose: true, autoResize: true, minWidth: width, minHeight: height}, title, null, null, onClose);

            //$.modal(
            //    $('<iframe/>').attr('width', width + 'px').attr('height', height + 'px').attr('src', src),
            //    {overlayClose: true, autoResize: true}
            //);
        });
    }

    function initToolBar() {
        $('.worksheet_element[data-type="G"], .worksheet_element[data-type="E"]', general.getWorkSheet()).each(function (idx, elem) {
            var header = $('.ws-element-header.notitle', elem);
            var width;
            if ($('article', elem).length) {
                width = $('article', elem).data("param-width");
            } else if ($('.applet_container', elem).length) {
                width = $('.applet_container', elem).width();
            }
            if (header.length && width !== undefined) {
                if ($('ul li', header).length > 1) {
                    header.addClass('widetoolbar');
                    $('.wsf-element-toolbar', header).css({right: (width - header.width() ) * -1});
                } else {
                    $('.wsf-element-toolbar', header).css({right: (width - header.width() + 25) * -1});
                }
            }
        });

        // Messages
        $('.message_announcement_close').click(function () {
            var id = $(this).parent().attr("id");
            id = id.substr(id.lastIndexOf("_") + 1);
            $(this).parents(".message-box").hide();
            document.cookie = "GeoGebraTubeA_" + id + "=1";
        });

    }

    function isTask() {
        return ($(general.getWorkSheet().get(0)).data('mode') == "task");
    }
    function isTaskSavable() {
        return ($(general.getWorkSheet().get(0)).data('taskissaveable'));
    }

    function addExerciseListeners(applet, container) {
        if (!isTask()) {
            // no exercise listener needed for worksheets that are no tasks
            return;
        }

        var timer;

        function exerciseModifiedListener() {
            if (timer) {
                window.clearTimeout(timer);
            }

            if (!isTaskSavable()) {
                // Don't react on changes when in read only mode
                return;
            }

            setExerciseModified();
            container.parents(".ws-element-exercise").data('isModified', 'true');
            restartAutoSaveTimer();
            timer = window.setTimeout(function() {
                saveOnUnload(true);
                window.clearTimeout(timer);
                timer = null;
            }, 3000);
        }

        applet.registerUpdateListener(exerciseModifiedListener);
        applet.registerAddListener(exerciseModifiedListener);
        applet.registerRemoveListener(exerciseModifiedListener);
        applet.registerClearListener(exerciseModifiedListener);
    }

    function isTaskElement(appletContainer) {
        var type = appletContainer.attr("data-element-type");
        if (type === null || type === undefined) {
            var parent = appletContainer.parents(".worksheet_element");
            type = parent.data("type");
        }

        return (type === general.ELEM_TYPE_Exercise);
    }

    function initAppletOnLoad() {
        if (typeof window.ggbAppletOnLoad === "function") {
            var oriAppletOnload = window.ggbAppletOnLoad;
        }
        window.ggbAppletOnLoad = function(id) {
            var container;
            if (typeof oriAppletOnload === "function") {
                oriAppletOnload(id);
            }
            
            // Check if the applet has exercises and init them
            var ggbApplet = general.getGGBAppletFromId(id);
            if (ggbApplet !== undefined) {
                var applet = ggbApplet.getAppletObject();
                if (applet !== undefined) {
                    console.log(id);
                    if (applet.isExercise && applet.isExercise()) {
                        console.log("Initializing exercise");
                        initExerciseApplet(general.getAppletContainerFromId(id), ggbApplet, applet);
                        var container = general.getAppletContainerFromId(id);
                        addExerciseListeners(applet, container);
                    } else if (isTaskElement(container = general.getAppletContainerFromId(id))) {
                        addExerciseListeners(applet, container);
                    }
                }
            }
        };
    }

    function initExerciseApplet(appletElem, ggbApplet, applet) {
        applet.startExercise();
        onAutoCheck(appletElem, ggbApplet, applet);
        var wsElement = appletElem.parents('.worksheet_element');
        // Show all autocheck controls
        wsElement.find('.ws-element-autocheck').show();
        // Handle check button
        wsElement.find('.ws-element-autocheck-btn').click(function() {
           onAutoCheck(appletElem, ggbApplet, applet, true);
        });

        // Init automatic checking if enabled
        if (wsElement.find('.ws-element-exercise').attr("data-autocheck") === "true") {
            var appletID = appletElem.attr("id");
            var checkWaiting = false;
            wsElement.find('.ws-element-autocheck-btn').hide();
            window["onAutoCheck"+appletID] = function() {
                // Execute the check not more than 2 times per seconds
                if (!checkWaiting) {
                    checkWaiting = true;
                    setTimeout(function() {
                        onAutoCheck(appletElem, ggbApplet, applet);
                        checkWaiting = false;
                    }, 500);
                }
            };
            applet.registerUpdateListener("onAutoCheck"+appletID);
            applet.registerAddListener("onAutoCheck"+appletID);
            applet.registerRemoveListener("onAutoCheck"+appletID);
            applet.registerClearListener("onAutoCheck"+appletID);
            // applet.registerStoreUndoListener("onAutoCheck"+appletID);
            // applet.registerClientListener("onAutoCheck"+appletID);
        }

        wsElement.find('.ws-element-autocheck-points').toggle(wsElement.find('.ws-element-exercise').attr("data-showpoints") === "true");
    }

    function onAutoCheck(appletElem, ggbApplet, applet, manualCheck) {
        if (manualCheck === undefined) {
            manualCheck = false;
        }
        var exresult = applet.getExerciseResult(),
            wsElem = appletElem.parents('.worksheet_element'),
            feedbackDiv = wsElem.find('.ws-element-autocheck-feedback'),
            wrongPartExists = false,
            singleCorrectIgnoreOthers = false,
            fractionsum = 0,
            key;
        feedbackDiv.find('.ws-element-autocheck-minus').html("");
        feedbackDiv.find('.ws-element-autocheck-text').html("");

        for (key in exresult) {
            if (0.999 < exresult[key].fraction) {
                singleCorrectIgnoreOthers = true;
                setAutocheckFeedback(wsElem, exresult, key);
                fractionsum += exresult[key].fraction;
            }
        }

        for (key in exresult) {
            if (!singleCorrectIgnoreOthers || exresult[key].fraction < 0) {
                setAutocheckFeedback(wsElem, exresult, key);
                fractionsum += exresult[key].fraction;
                if (exresult[key].fraction < 0){
                    wrongPartExists = true;
                }
            }
        }

        var points = feedbackDiv.find('.ws-element-autocheck-points');
        var pointsTarget = feedbackDiv.find('.ws-element-autocheck-minusandpoints');
        var text = $('<div/>').html(points.attr("data-text-score")).text();
        points.html("");
        pointsTarget.removeClass("points-zero").removeClass("points-zero-wrong").removeClass("points-below-max").removeClass("points-max");

        $('.ws-element-applet', wsElem).attr("data-is-graded", fractionsum > 0.999);

        if (fractionsum > 0.999) {
            pointsTarget.addClass("points-max");
            points.text(text.replace("{$1}", 100));

            // Show a hint that the task was solved
            exresult.autocheck_complete = {fraction: 0, hint: points.attr("data-text-complete"), result: "CORRECT"};
            setAutocheckFeedback(wsElem, exresult, "autocheck_complete");

        } else if (fractionsum > 0.001) {
            pointsTarget.addClass("points-below-max");
            points.text(text.replace("{$1}", Math.round(fractionsum * 100)));
        } else {
            points.text(text.replace("{$1}", 0));
            if (wrongPartExists) {
                pointsTarget.addClass("points-zero-wrong");
            } else {
                pointsTarget.addClass("points-zero");
            }
        }

        // Show a hint that the task was not solved
        if (manualCheck && 0.999 >= fractionsum) {
            exresult.autocheck_complete = {fraction: 0, hint: points.attr("data-text-incomplete"), result: "WRONG"};
            setAutocheckFeedback(wsElem, exresult, "autocheck_complete");
        }

    }

    function setAutocheckFeedback(wsElem, exresult, key) {
        var keyID = key.split(" ").reverse()[0];
        
        var feedbackDiv = wsElem.find('.ws-element-autocheck-feedback');
        var worksheet = wsElem.parents('.wsf-ws-scroller');
        var feedback = worksheet.find('.'+keyID+"feedback")[0];
        if (feedback !== undefined) {
            feedback.innerHTML = "";
        } else {
            feedback = document.createElement("p");
            $(feedback).addClass("autocheck-feedback");
            $(feedback).addClass(keyID+"feedback");
        }

        // Check if there is a text element for this key
        var target = worksheet.find('.'+keyID);
        if (target.length === 0) {
            if (exresult[key].fraction < 0) {
                target = feedbackDiv.find('.ws-element-autocheck-minus');
            }
            if (target.length === 0) {
                target = feedbackDiv.find('.ws-element-autocheck-text');
            }
        }

        var correctIndicator = target;
        if (exresult[key].hint !== "" && (key === "autocheck_complete" || wsElem.find('.ws-element-exercise').attr("data-showhints") === "true")) {
            $(feedback).text(exresult[key].hint);
            if (target.children().length > 0) {
                target.children().last().append(feedback);
            } else {
                target.append(feedback);
                correctIndicator = $(feedback);
            }
        }

        if (exresult[key].result === "CORRECT") {
            correctIndicator.addClass("autocheck-correct");
            correctIndicator.removeClass("autocheck-incorrect");
        } else {
            correctIndicator.removeClass("autocheck-correct");
            correctIndicator.addClass("autocheck-incorrect");
        }
    }

    function initBBCode(worksheet_tbl) {
        $('.bbcode-text', worksheet_tbl).each(function () {
            var bbcode = this.textContent || this.innerText;
            var html = window.GGBT_texthandlers.getHTMLFromBBCode(bbcode);
            $(this).removeClass("bbcode-text");
            $(this).html(html);

            if (window.GGBT_texthandlers.isLatexRenderer("mathquill")) {
                $('.mathquill-embedded-latex', this).mathquill();
            } else {
                window.GGBT_jlatexmath.drawLatexOnjQuery($(".jlatexmath", this));
            }
        });
    }

    function initNewWorksheet(worksheet) {
        var oldWorksheet = general.getWorkSheet();
        general.setWorksheet(worksheet);
        initBBCode(worksheet);
        if (oldWorksheet && oldWorksheet.length > 0) {
            general.setWorksheet(oldWorksheet);
        }

        resizeVideos(false);
        initVideos(worksheet);
        initWebElements(worksheet);
        initPdfElements(worksheet);
        initButtons(worksheet);
        initAutoSave();
        initQuestionElements();
    }

    function initPdfElements(worksheet) {
        if (worksheet === undefined || worksheet === null) {
            $(".wsf-ws-scroller").each(function() {
                initPdfElements($(this));
            });
        } else {
            worksheet.find('.ws-element-pdf').each(function() {
                checkPdfSupport($(this));
            });
        }
    }

    var resizeVideos = function (allWS) {
        // Scale down videos if screen is smaller then the video
        var videos = (allWS ? $('.ws-element-video iframe') : $('.ws-element-video iframe', general.getWorkSheet()));
        videos.each(function (i, e) {
            var windowWidth = (typeof( window.innerWidth ) === 'number') ? window.innerWidth : document.documentElement.clientWidth;
            var wsRect = $(e).parents('.wsf-ws-scroller')[0].getBoundingClientRect();
            var rect = e.getBoundingClientRect();
            var videoBorder = (rect.left - wsRect.left) * 2;

            $(e).css({maxWidth: windowWidth - videoBorder});
            $(e).parent().css({maxWidth: windowWidth - videoBorder});
        });
    };

    function initResize() {
        resizeVideos(true);

        $(window).resize(function () {
            resizeVideos(true);
        });
    }


    function initPrevNext(worksheet) {
        var buttons = worksheet.find(".j-nav-prev.j-nav-previspostentry, .j-nav-next.j-nav-nextispostentry, .jStudent .j-nav-next, .jStudent .j-nav-prev");
        if (buttons.length) {
            buttons.on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!$(this).hasClass("inactive")) {
                    var msg = {
                        type: "loadnextpage",
                        href: $(this).attr("href"),
                        contentType : $(this).data("type")
                    };
                    window.parent.postMessage(JSON.stringify(msg), window.GGBT_gen_singleton.ORIGIN);
                }
            });
        }
    }

    function attachEventsToSingleton(worksheet) {
        initBBCode(worksheet);
        resizeVideos(false);
        initVideos(worksheet);
        initWebElements(worksheet);
        initPdfElements(worksheet);
        initButtons(worksheet);
        initAutoSave();
        initPrevNext(worksheet);
        initQuestionElements();
    }

    function addLoadingForAjax() {
        var loadingContainer = $('<div style="height: 90vh;" />');
        if (!window.GGBT_book_general) {
            window.GGBT_ws_header_footer.setWsScrollerHeight();
            $(".worksheet_tbl").empty().append(loadingContainer);
            window.GGBT_spinner.attachSpinner(loadingContainer.get(0), "50%");
        } else {
            $("#content").empty().append(loadingContainer);
            window.GGBT_spinner.attachSpinner(loadingContainer.get(0), "50%");
        }
    }

  function hideContentAndShowSpinner() {
    var loadingContainer = $('<div style="height: 90vh;" />');
    if (!window.GGBT_book_general) {
      window.GGBT_ws_header_footer.setWsScrollerHeight();
      $(".worksheet_tbl").children().hide();
      $(".worksheet_tbl").append(loadingContainer);
      window.GGBT_spinner.attachSpinner(loadingContainer.get(0), "50%");
    } else {
      $("#content").children().hide();
      $("#content").empty().append(loadingContainer);
      window.GGBT_spinner.attachSpinner(loadingContainer.get(0), "50%");
    }
  }

    function destroyApplets() {
        var applets = $("article, article[data-param-id]");
        if (applets && applets.length) {
            applets.each(function() {
                if ($(this).attr("data-param-id") && window[$(this).attr("data-param-id")]) {
                    window[$(this).attr("data-param-id")].remove();
                    console.log("applet removed");
                } else if (window.ggbApplet) {
                    window.ggbApplet.remove();
                    console.log("applet removed");
                }
            });
        }
    }

    var currentPage = {
        href: window.location.href,
        contentType : "ws"
    };

    function loadMaterial(obj) {
        addLoadingForAjax();
        currentPage = obj;
        loadWithAjax(obj);
    }

    function processMessage(data) {
        var obj ={},
            typeAndId;
        try{
            obj = JSON.parse(data);
	}catch(e){
            //invalid message, maybe from browser extension
	    return;
	}
        if (obj.type === "loadcontent") {
            loadMaterial(obj);
        } else if (obj.type === "closedbyhost") {
            if ($('.jSave').length > 0) {
                beforeUnload(false, function () {
                    window.GGBT_wsf_view.destroyApplets();
                    window.GGBT_wsf_view.addLoadingForAjax();
                });
            } else {
                window.GGBT_wsf_view.destroyApplets();
                window.GGBT_wsf_view.addLoadingForAjax();
            }

        }
    }

    function initSingleton() {
        window.addEventListener("message", function(event) {
            var origin = event.origin || event.originalEvent.origin;
            if (origin === window.GGBT_gen_singleton.ORIGIN) {
                processMessage(event.data);
            }
        });
    }

    function init() {
        initResize();
        var worksheet = general.getWorkSheet();
        appMode = worksheet.find('.worksheet_tbl').data("appmode");
        general.getWsfInfoContent();
        general.getWsfInfo();
        initQuestionElements();
        initWebElements();
        initPdfElements();
        initButtons();
        initAutoSave();
        initRightPaddingHeadlines();
        initAppletOnLoad();
        initSingleton();
        initBBCode(worksheet.find(".worksheet_tbl"));
        window.GGBT_gen_backURL.init();
    }

    /**
     *  This function sets the padding of the title of a worksheet element
     *  according to the element toolbar width
     */
    function initRightPaddingHeadlines() {
        $.each($('.wsf-content-added'), function() {
            var elementToolbar = $(this).find('.wsf-element-toolbar');

            if($('html').attr('dir') === "rtl") {
                $(this).find('.ws-element-title').css('padding-left', elementToolbar.outerWidth());
            } else {
                $(this).find('.ws-element-title').css('padding-right', elementToolbar.outerWidth());
            }
        });
    }

    function setData(d) {
        general.setData(d);
    }

    function postProcessApplet(container) {
        if (container) {
            general
                .adjustContentToResize(container);
        }
    }

    function checkPdfSupport(element) {
        if (ismobile === null) {
            ismobile = mobileAndTabletcheck();
        }
        if (ismobile) {
            element.attr("data-popup", true);
            element.attr("data-download", true);
        }
        element.removeAttr("data-checked");
    }

    function setDefaults(d) {
        defaults = d;
    }

    function setSaveStateSuccessful() {
        _isSaving = false;
        general.enableSaveButtons(true);
        autoSaveMessage("save_successful");
        if (window.GGBT_gen_edit.getSaveState() == window.GGBT_gen_edit.SAVE_STATE_ERROR) {
          window.GGBT_gen_edit.setSaveStateSuccessful();
        }
    }

    function setSaveStateInProgress() {
        _isSaving = true;
        if (!autosaving) {
            general.enableSaveButtons(false);
        }
        autoSaveMessage("save_inprogress");
    }

    function setSaveStateError(error) {
        _isSaving = false;
        general.enableSaveButtons(true);
        autosaving = false;
        window.GGBT_gen_edit.setSaveStateError(error);
        autoSaveMessage("save_state_error");
    }

    return {
        init: init,
        setData: setData,
        setDefaults: setDefaults,
        initNewWorksheet: initNewWorksheet,
        postProcessApplet: postProcessApplet,
        checkPdfSupport: checkPdfSupport,
        renderFullScreen : renderFullScreen,
        isMobileDevice : mobileAndTabletcheck,
        setCloseBtnPosition : setCloseBtnPosition,
        isFullscreen : isFullscreen,
        launchFullScreen : launchFullScreen,
        exitFullScreen : exitFullScreen,
        getCloseBtnPosition : getCloseBtnPosition,
        addLoadingForAjax : addLoadingForAjax,
        setSaveStateSuccessful : setSaveStateSuccessful,
        setSaveStateError : setSaveStateError,
        setSaveStateInProgress : setSaveStateInProgress,
        destroyApplets : destroyApplets,
        isFullScreen : isFullscreen,
        closeFullScreen : closeFullScreen
    };

})(jQuery, GGBT_wsf_general);

//jlatexmath needs window.onload
jQuery(document).ready(function () {
    "use strict";
    GGBT_wsf_view.init();
});

window.GGBT_wsf_comments = (function () {
    "use strict";

    var data = null;

    function setData(newData) {
        data = newData;
        if (window.GGBT_comments) {
            window.GGBT_comments.setData({loggedinuser_id: data.loggedinuser_id, user_right: data.user_right});
        }
    }

    function appendToElement(obj) {
        var element = null;

        if (obj.element_id > 0) {
            element = $("#worksheet_element_" + obj.element_id);
        } else {
            element = $("#worksheet_element_global");
        }

        var comments = element.find('.comments');

        if (comments.length <= 0) {
            return;
        }

        element.find(".comments.post-comments .count").attr("display");

        // commenting ist allowed to everyone who is logged in in groups
        // commenting in classrooms is only allowed for teacher and student (and editor)
        var allowComment = data.loggedinuser_id !== -1 && !(data.type === "C" && data.user_right === "V");
        if (!allowComment) {
            comments.find('.new-comment').hide();
        }

        obj.commentsArray.forEach(function (item) {
            window.GGBT_comments.appendToCommentList($('.comments-list', element), item);

            // show comment - section if there is a new comment!
            if ((item.date_lastread) && (item.date_created > item.date_lastread) &&
                (item.userid !== data.loggedinuser_id)) {
                $(".post-comments", element).show();
            }
        });

        window.GGBT_comments.modifyCommentCounter({
            comments: comments,
            comments_counter: obj.comments,
            toggle: true
        });

        //window.GGBT_comments.attachHandlersToNewComment(comments);
    }

    function saveAllUnsavedComments(worksheet) {
        $('.comments-list .comment.editstate', worksheet).each(function() {
            var textarea = $('.edit-comment-text', $(this));
            if (textarea.val() !==  $('.comment-text', $(this)).attr("data-content")) {
                window.GGBT_comments.saveEditedComment(textarea);
            }
        });

        $('.comments-list .comment.new-comment', worksheet).each(function() {
            var textarea = $('.new-comment-text', $(this));
            if (textarea.val().length > 0) {
                window.GGBT_comments.saveNewComment(textarea);
            }
        });
    }

    function populateComments() {
        data.elements.forEach(function (item) {
            appendToElement(item);
        });
    }

    function populateCommentContent() {
        if (data && data.elements && data.elements.length) {
            // if the worksheet contains just two elements
            // (first element: worksheet element, second element: global comments)
            // --> hide the comment section for the element, show the global comments
            // and hide the comment - button!
            if (data.elements.length <= 2) {
                $('.j-worksheet-comment-button').hide();
            }

            populateComments();
        }

        // Hide all comment lists without comments
        $(".post-comments").each(function() {
            if ($(this).find('.comments-list .comment.viewstate').length === 0) {
                $(this).hide();
                $(this).parents(".worksheet_element").addClass('commentsHidden');
            } else {
                $(this).show();
                $(this).parents(".worksheet_element").removeClass('commentsHidden');
            }
        });

        $(".post-comments", $("#worksheet_element_global")).show();

    }

    function init() {
        // add action - listener!
        $(".j-worksheet-comment-button").on("click", function () {
            var container = $(this).parents(".worksheet_element");
            if (!$(".post-comments", container).is(":visible")) {
                container.removeClass('commentsHidden');
                container.addClass("addComment");
                setTimeout(function () {
                        container.removeClass("addComment");
                    },
                    1500);
            }

            $(".post-comments", container).slideToggle();
            $(".new-comment-text", container).focus();
        });

        populateCommentContent();
    }

    return {
        init: init,
        setData: setData,
        saveAllUnsavedComments: saveAllUnsavedComments
    };
})();

$(document).ready(function () {
    "use strict";
    window.GGBT_wsf_comments.init();
});
