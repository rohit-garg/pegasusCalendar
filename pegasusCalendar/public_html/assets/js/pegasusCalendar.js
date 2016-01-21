/* Description: Scrollable Calendar with one year visible, to and from in one field
 * Dependencies: jQuery & msCalendar      
 * Version: 1.0.3
 * Date: 07 Dec 2015
 * */

function PegasusCalendar(opt) {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var _this = this;
    var modes = {
        R: 'R',
        O: 'O'
    };
    this.mode = modes.O;
    this.fromDate = null;
    this.toDate = null;
    this.fromEle = null;
    this.toEle = null;

    var defaultID = 'PegasusCal-' + PegasusCalendar.prototype.count;

    var settings = $.extend({
        minDate: new Date(),
        maxDate: null,
        daysNum: 0,
        inputEle: null,
        departOnly: false,
        returnCalOnly: false,
        hideModes: false,
        outputFormat: null,
        sameDayReturn: {allow: true, cb: null},
        selectTxts: ['Select Departure Date', 'Select Return Date'],
        retrunTxt: 'Return date',
        defaultMode: _this.mode,
        holder: '#' + defaultID,
        onOpen: null
    }, opt);

    $('body').append($('<div id="' + defaultID + '" >'));

    var inputEle = $(settings.inputEle);
    var holder = $(settings.holder);

//    if (typeof opt.holder === "undefined") {
//        holder = $('<div id="' + settings.holder + '" >');
//    }

    var clsNames = {
        monthBox: 'month-box',
        monthTitle: 'month-title',
        dayContainer: 'day-container',
        monthContainer: 'js-month-container',
        monthSlider: 'active-mark',
        dayAnchor: 'datetext',
        monthWrapper: 'js-viewport',
        monthList: 'month-list',
        headEle: 'cal-head',
        modes: {
            radio: 'js-mode-type',
            container: 'head-right',
            showReturn: 'show-return'
        },
        day: {
            from: 'depart-daybox',
            mid: 'mid-daybox',
            to: 'return-daybox'
        }
    };

    var callbackArr = {dateChange: [], modeChange: [], open: []};

    var msCal = new msCalendar();

    var _init = function () {
        _setMaxDate();
        _clearInputCache();
        _generateHTML();
        _createMonthList();
        _createAllMonths();
        _attachEvents();
        _attachCallbacks();
        _checkCalType();
    };

    var _setMaxDate = function () {
        var days = settings.daysNum;
        if (days) {
            var tempDate = new Date(settings.minDate);
            tempDate.setDate(tempDate.getDate() + days);
            settings.maxDate = new Date(tempDate);
        }
    };

    this.setDates = function (obj) {
        var tempFrom = obj.from;
        var tempTo = obj.to;

        if (tempFrom) {
            _this.resetDates();
            if (tempTo) {
                _selectRoundTrip();
                $('a.' + clsNames.dayAnchor, holder).filter('#' + getAnchorId(tempTo)).click();
            }
            $('a.' + clsNames.dayAnchor, holder).filter('#' + getAnchorId(tempFrom)).click();
        }
        function getAnchorId(str) {
            return 'a_' + str.split('/').reverse().join('_');
        }
    };

    var _createMonth = function (date) {
        var monthBox = $('<div class="' + clsNames.monthBox + '" />');
        var month = monthNames[date.getMonth()];
        var monthTitle = $('<div class="' + clsNames.monthTitle + '" />').html(month);
        var month_id = settings.holder.slice(1) + '-month-' + (date.getMonth() + 1) + '-' + date.getFullYear();
        $('#' + month_id).parent().remove();
        var dayContainer = $('<div class="' + clsNames.dayContainer + '" id="' + month_id + '" />').get(0);
        monthBox.append(monthTitle, dayContainer);
        $('.' + clsNames.monthContainer, holder).append(monthBox);
        msCal.init(month_id, date, undefined, undefined, settings.minDate, settings.maxDate);
    };

    var _createAllMonths = function () {
        var date = new Date();
        date.setDate(1);
        for (var i = 0; i < 12; i++) {
            var num = date.getMonth();
            _createMonth(date);
            date.setMonth(num + 1);
        }
    };

    this.setMinDate = function (date) {
        if (date) {
            settings.minDate = date;
            _createAllMonths();
        }
        if (date >= _this.fromDate) {
            _this.resetDates();
        }
        if (_this.fromEle) {
            var eleId = $(_this.fromEle).attr('id');
            _this.fromEle = $('a.' + clsNames.dayAnchor, holder).filter('#' + eleId);
            $('a.' + clsNames.dayAnchor, holder).filter('#' + eleId).parent().addClass('depart-daybox');
        }
    };

    this.resetDates = function () {
        _this.fromDate = null;
        _this.toDate = null;
        _this.fromEle = null;
        _this.toEle = null;
        _updateInput();
    };

    var _createMonthList = function () {
        var date = new Date();
        date.setDate(1);
        for (var i = 0; i < 12; i++) {
            var num = date.getMonth();
            var year = num == 0 ? "<small>" + date.getFullYear() + "</small>" : "";
            $('.' + clsNames.monthList, holder).append('<li><a href="#' + settings.holder.slice(1) + '-month-' + (num + 1) + '-' + date.getFullYear() + '">' + monthNames[num] + ' ' + year + '</a></li>');
            date.setMonth(num + 1);
        }
        $('.' + clsNames.monthList, holder).append('<li class="' + clsNames.monthSlider + '"></li>');
    };

    this.selectDate = function (ele, dontClose) {
        var date = ele.date;
        if (_this.fromDate == null) {
            selectFrom();
        }
        else {
            if (_this.mode == modes.O) {
                selectFrom();
                _this.toDate = null;
                _this.toEle = null;
            }
            else if (_this.mode == modes.R) {
                if (_this.toDate == null) {
                    selectTo();
                }
                else {
                    selectFrom();
                    _this.toDate = null;
                    _this.toEle = null;
                }
            }
        }
        _updateDayClasses();
        _updateModeClasses();

        inputEle.data({
            fromDate: _this.fromDate,
            toDate: _this.toDate,
            mode: _this.mode
        });

        if (!dontClose) {
            if (_this.mode == modes.O) {
                _closeCalendar();
            }
            else if (_this.mode == modes.R && _this.toDate != null) {
                _closeCalendar();
            }
        }

//        console.log(inputEle.data());
        _fireCallback("dateChange", _this.getCurrentState());

        function selectFrom() {
            _this.fromDate = date;
            _this.fromEle = ele;
        }
        function selectTo() {
            if (!settings.sameDayReturn.allow && _this.fromDate == date) {
                if (settings.sameDayReturn.cb) {
                    settings.sameDayReturn.cb.call(_this, {ele: ele});
                }
                return;
            }
            _this.toDate = date;
            _this.toEle = ele;
            if (_this.toDate.getTime() < _this.fromDate.getTime()) {
                swap();
            }
        }
        function swap() {
            var t1 = _this.toDate;
            var t2 = _this.toEle;

            _this.toDate = _this.fromDate;
            _this.toEle = _this.fromEle;

            _this.fromDate = t1;
            _this.fromEle = t2;
        }
    };

    this.clearPrices = function () {
        $('a.' + clsNames.dayAnchor, holder).each(function () {
            $('.price', this).remove();
        });
    };

    this.dateToStr = function (d, seperator) {
        return getByDate(d, seperator);
    };

    this.updatePrices = function (data) {

        var fares = data.allFares;
        var lf = data.lowestFare;
//        console.log(fares);

        $('a.' + clsNames.dayAnchor, holder).each(function () {
            $('.price', this).remove();
            var tempDate = this.date;
            var dateStr = getByDate(tempDate);
            var monthLF = lf[tempDate.getMonth()];
            if (typeof fares[dateStr] != "undefined") {
                $(this).append(getPriceSpan(fares[dateStr], monthLF));
            }
        });

        function getPriceSpan(f, lf) {
            var lpCls = 'lowestPrice';
            if (f != lf) {
                lpCls = '';
            }
            var str = '<span class="price ' + lpCls + '"><span class="RupeeSign">Rs.</span>' + getFormattedPrice(f) + '</span>';
            return str;
        }

        function getFormattedPrice(number) {
            var regexp = new RegExp(/(\d)(?=(\d\d\d)+(?!\d))/g);
            if (typeof number != 'undefined') {
                var fNumber = number.toString().replace(regexp, "$1,");
            }
            if (fNumber.length > 6) {
                return fNumber.substring(0, 1) + "," + fNumber.substring(1, fNumber.length);
            }
            else {
                return	number.toString().replace(regexp, "$1,");
            }
        }

    };

    var getByDate = function (dt, seperator) {
        var dd = dt.getDate();
        var mm = (dt.getMonth() + 1);
        var yyyy = dt.getFullYear();
        dd = dd < 10 ? "0" + dd : dd;
        mm = mm < 10 ? "0" + mm : mm;
        if (!seperator) {
            seperator = "/";
        }
        var dtStr = (dd + seperator + mm + seperator + yyyy);
        return dtStr;
    };

    this.on = function (type, cb) {
        if (callbackArr[type]) {
            callbackArr[type].push(cb);
        }
    };

    this.getCurrentState = function () {
        return {F: _this.fromDate, T: _this.toDate, M: _this.mode, modes: modes, ele: inputEle};
    };

    this.setMode = function (type) {
        var radioEle = $('input.' + clsNames.modes.radio, holder);
        if (typeof (type) != "undefined" && type) {
            radioEle.each(function () {
                var val = $(this).val();
                if (val == type) {
                    $(this).trigger('click');
                }
            });
        }
    };

    var _updateModeClasses = function () {
        if (_this.mode == modes.R && _this.fromDate != null && _this.toDate == null) {
            $('.' + clsNames.headEle, holder).addClass(clsNames.modes.showReturn);
        }
        else {
            $('.' + clsNames.headEle, holder).removeClass(clsNames.modes.showReturn);
        }
    };

    var _updateDayClasses = function () {
        $('a.' + clsNames.dayAnchor, holder).parent().removeClass(clsNames.day.from + ' ' + clsNames.day.mid + ' ' + clsNames.day.to);
        $(_this.fromEle).parent().addClass(clsNames.day.from);
        $(_this.toEle).parent().addClass(clsNames.day.to);
        if (_this.toDate) {
            $('a.' + clsNames.dayAnchor, holder).each(function () {
                var cTime = this.date.getTime();
                var fTime = _this.fromDate.getTime();
                var rTime = _this.toDate.getTime();
                if (cTime > fTime && cTime < rTime) {
                    $(this).parent().addClass(clsNames.day.mid);
                }
            });
        }
    };

    var _fireCallback = function (key, arg) {
        for (var i = 0; i < callbackArr[key].length; i++) {
            callbackArr[key][i].call(_this, arg);
        }
    };

    var _attachEvents = function () {

        $('.' + clsNames.monthList + ' a', holder).live('click', function (e) {
            e.preventDefault();
            var id = $(this).attr('href');
            var top = $(id).parent().position().top;
            $('.' + clsNames.monthWrapper, holder).animate({scrollTop: top}, 200);
        });

        $('.' + clsNames.monthWrapper, holder).scroll(function () {
            var scrolledY = $(this).scrollTop();
            var viewportHeight = $(this).height();
            var height = $('.' + clsNames.monthContainer, holder).height();
            var percent = scrolledY * 100 / (height - 35);
            $('.' + clsNames.monthSlider, holder).css({top: percent + "%"});
//                console.log(scrolledY, viewportHeight, height, percent);
        });

        $('a.' + clsNames.dayAnchor, holder).live('mouseover', function (e) {
            e.preventDefault();
            if (_this.mode == modes.R && _this.fromDate != null && _this.toDate == null) {
                var fTime = _this.fromDate.getTime();
                var targetTime = this.date.getTime();
                $('a.' + clsNames.dayAnchor, holder).each(function () {
                    var meTime = this.date.getTime();
                    if ((meTime > fTime && meTime < targetTime) || (meTime < fTime && meTime > targetTime)) {
                        $(this).parent().addClass(clsNames.day.mid);
                    }
                    else {
                        $(this).parent().removeClass(clsNames.day.mid);
                    }
                });
            }
            if (isInRange(this)) {
                _updateInput(gethoverDS(this));
            }
            else {
                _updateInput(_this.getCurrentState());
            }

        });

        $('.js-month-container', holder).mouseleave(function () {
            _updateInput(_this.getCurrentState());
            _updateDayClasses();
        });

        function gethoverDS(ele) {
            var obj = {F: _this.fromDate, T: _this.toDate, M: _this.mode, modes: modes};
            var cur = ele.date;
            if ((!obj.F) || (obj.F && obj.T) || (obj.M == obj.modes.O)) {
                obj.F = ele.date;
            }
            else if (!obj.T) {
                obj.T = ele.date;
                if (obj.T.getTime() < obj.F.getTime()) {
                    obj.T = obj.F;
                    obj.F = ele.date;
                }
                else {
                }
            }
            return obj;
        }

        function isInRange(ele) {
//            if ((settings.minDate.getTime() <= ele.date.getTime()) && (settings.maxDate && settings.maxDate.getTime() >= ele.date.getTime())) {
            if (settings.maxDate) {
                if ((settings.minDate <= ele.date) && (settings.maxDate >= ele.date)) {
                    return true;
                }
            }
            else if (settings.minDate <= ele.date) {
                return true;
            }
            return false;
        }

        $('a.' + clsNames.dayAnchor, holder).live('click', function (e) {
            e.preventDefault();
            if (isInRange(this)) {
                _this.selectDate(this);
            }
        });

        var radioEle = $('input.' + clsNames.modes.radio, holder);
        radioEle.live('change', function (e) {
            var input = $('input.' + clsNames.modes.radio + ':checked', holder);
            var val = input.val();
            _this.mode = modes[val];
            if (_this.fromEle) {
                _this.selectDate(_this.fromEle, true);
            }
            radioEle.parent().removeClass('active');
            input.parent().addClass('active');
            _fireCallback("modeChange", _this.getCurrentState());
        });

        radioEle.trigger('change');
        $('.' + clsNames.monthList + ' a', holder).first().click();

        inputEle.focus(function () {
            var offset = $(this).offset();
            var top = offset.top + $(this).outerHeight();
            var left = offset.left - holder.outerWidth() / 2 + $(this).outerWidth() / 2;
            var cssSettings = {
                top: top,
                left: left
            };
            $(holder).css(cssSettings);
            $(holder).fadeIn(200);
            scrollToRightMonth();
            _fireCallback("open", _this.getCurrentState());
        });

        $(document).mouseup(function (e) {
            var container = $(holder);
            if (!container.is(e.target) && !inputEle.is(e.target) && container.has(e.target).length == 0) {
                _closeCalendar();
            }
        });

        $('.calViewMessage a.close-cal', holder).live('click', function (e) {
            e.preventDefault();
            _this.hideMessage(true);
        });

        function scrollToRightMonth() {
            var tempDate = _this.fromDate ? _this.fromDate : settings.minDate;
            if (tempDate) {
                var monthId = defaultID + '-month-' + (tempDate.getMonth() + 1) + '-' + tempDate.getFullYear();
                $('a[href="#' + monthId + '"]').click();
            }
        }

        /*$('a.' + clsNames.dayAnchor, holder).live({
         mouseenter: function () {
         var clone = $(this).children('.holiday-desc').clone();
         clone.appendTo('body');
         clone.css($(this).offset()).show();
         $(this).data('tooltipclone', clone);
         },
         mouseleave: function () {
         var clone = $(this).data('tooltipclone');
         clone.remove();
         }
         });*/
    };

    var _closeCalendar = function () {
        $(holder).fadeOut(200);
        inputEle.blur();
    };

    var _generateHTML = function () {
        var head = $('<div class="cal-head"/>');
        var headL = $('<div class="head-left"/>');
        var headR = $('<div class="head-right"/>');

        headL.append('<label><input class="js-mode-type" type="radio" name="' + settings.holder + 'mode" value="O" checked="checked" />one way</label>');
        headL.append('<label><input class="js-mode-type" type="radio" name="' + settings.holder + 'mode" value="R" />Round-trip</label>');

        headR.append('<div class="">' + settings.selectTxts[0] + '</div>');
        headR.append('<div class="">' + settings.selectTxts[1] + '</div>');
        head.append(headL, headR);

        var body = $('<div class="cal-body"/>');
        var bodyL = $('<div class="body-left"/>');
        var bodyR = $('<div class="body-right"/>');

        var table = $('<table class="days-head" />');
        var tr = $('<tr />');
        tr.append('<th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>FRI</th><th>SAT</th>');
        table.append(tr);

        bodyL.append('<ul class="month-list"></ul>');
        bodyR.append(table, '<div class="month-wrapper js-viewport"><div class="js-month-container"></div></div>');
        body.append(bodyL, bodyR);

        var messageStrip = $('<div class="calViewMessage"><div class="cal-msg-desc">Message to Show</div><a title="Hide Message" href="#" class="close-cal sprite" /></div>');

        $('body').append(holder);

//        console.log(head, body);
        holder.html('').append(head, messageStrip, body).addClass('pegasus-cal');
    };

    var _checkCalType = function () {
        if (settings.departOnly) {
            var radioEle = $('input.' + clsNames.modes.radio, holder).eq(0);
            radioEle.trigger('click');
            $('.head-left', holder).hide();
        }
        else if (settings.returnCalOnly) {
            var radioEle = $('input.' + clsNames.modes.radio, holder).eq(1);
            radioEle.trigger('click');
            $('.head-left', holder).hide();
        }
        if (settings.hideModes) {
            $('.head-left', holder).hide();
        }
        if (settings.defaultMode == "R") {
            _selectRoundTrip();
        }
    };

    var _selectRoundTrip = function () {
        var radioEle = $('input.' + clsNames.modes.radio, holder).eq(1);
        radioEle.trigger('click');
    };

    this.hideMessage = function (slide) {
        if (slide) {
            $('.calViewMessage', holder).slideUp();
        }
        else {
            $('.calViewMessage', holder).hide();
        }
    };

    this.updateMessage = function (msg, show) {
        $('.calViewMessage', holder).children('.cal-msg-desc').html(msg).slideDown();
        if (show) {
            _this.hideMessage();
            $('.calViewMessage', holder).slideDown();
        }
    };

    var _attachCallbacks = function () {
        _this.on('dateChange', function (res) {
            _updateInput(res);
        });

        _this.on('modeChange', function (res) {
            _updateInput(res);
        });

        if (typeof settings.onOpen == "function") {
            _this.on('open', settings.onOpen);
        }
    };

    var _updateInput = function (obj) {
        var str = '';
        if (obj && obj.F) {
            str = getDateStr(obj.F);
            if (obj.M == obj.modes.R) {
                str += ' to ';
                if (obj.T != null) {
                    str += getDateStr(obj.T);
                }
                else {
                    str += settings.retrunTxt;
                }
            }
            else if (settings.outputFormat != 'dd/mm/yyyy') {
                str += ' ' + obj.F.getFullYear();
            }
        }
        inputEle.val(str);
        function getDateStr(date) {
            if (settings.outputFormat == 'dd/mm/yyyy') {
                return _this.dateToStr(date, '/');
            }
            return (date.getDate() + ' ' + monthNames[date.getMonth()].slice(0, 3));
        }
    };

    var _clearInputCache = function () {
        inputEle.val('');
    };

    _init();
    inputEle.data('pegasusCal', this);
    PegasusCalendar.prototype.count++;
}

PegasusCalendar.prototype.count = 0;

