/* Description: Scrollable Calendar with one year visible, to and from in one field
 * Dependencies: jQuery & msCalendar      
 * Version: 1.0.0 
 * Date: 07 Dec 2015
 * */

function PegasusCalendar(opt) {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var _this = this;
    var modes = {
        R: 'Round-Trip',
        O: 'One Way'
    };
    this.mode = modes.R;
    this.fromDate = null;
    this.toDate = null;
    this.fromEle = null;
    this.toEle = null;

    var settings = $.extend({
        restrictDate: new Date(),
        inputEle: null,
        holder: '#PegasusCal-' + PegasusCalendar.prototype.count
    }, opt);

    var holder = $(settings.holder);

    if (typeof opt.holder === "undefined") {
        holder = $('<div id="' + settings.holder + '" >');
    }

    var clsNames = {
        monthBox: 'month-box',
        monthTitle: 'month-title',
        dayContainer: 'day-container',
        monthContainer: 'js-month-container',
        monthSlider: 'active-mark',
        dayAnchor: 'datetext',
        monthWrapper: 'js-viewport',
        monthList: 'month-list',
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

    var callbackArr = {dateChange: [], modeChange: []};

    var msCal = new msCalendar();

    var _init = function () {
        _clearInputCache();
        _generateHTML();
        _createMonthList();
        _createAllMonths();
        _attachEvents();
        _attachCallbacks();
    };

    var _createMonth = function (date) {
        var monthBox = $('<div class="' + clsNames.monthBox + '" />');
        var month = monthNames[date.getMonth()];
        var monthTitle = $('<div class="' + clsNames.monthTitle + '" />').html(month);
        var month_id = settings.holder.slice(1) + '-month-' + (date.getMonth() + 1) + '-' + date.getFullYear();
        var dayContainer = $('<div class="' + clsNames.dayContainer + '" id="' + month_id + '" />').get(0);
        monthBox.append(monthTitle, dayContainer);
        $('.' + clsNames.monthContainer, holder).append(monthBox);
        msCal.init(month_id, date, undefined, undefined, settings.restrictDate);
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
        $(settings.inputEle).data({
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

//        console.log($(settings.inputEle).data());
        _fireCallback("dateChange", _this.getCurrentState());

        function selectFrom() {
            _this.fromDate = date;
            _this.fromEle = ele;
        }
        function selectTo() {
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

    this.updatePrices = function (data) {

        var fares = data.allFares;
        var lf = data.lowestFare;
//        console.log(fares);

        $('a.' + clsNames.dayAnchor, holder).each(function () {
            $('.price', this).remove();
            var date = this.date;
            var dateStr = getByDate(date);
            var monthLF = lf[date.getMonth()];
            if (typeof fares[dateStr] != "undefined") {
                $(this).append(getPriceSpan(fares[dateStr], monthLF));
            }
        });

        function getByDate(dt) {
            var dd = dt.getDate();
            var mm = (dt.getMonth() + 1);
            var yyyy = dt.getFullYear();
            dd = dd < 10 ? "0" + dd : dd;
            mm = mm < 10 ? "0" + mm : mm;
            var dtStr = (dd + "/" + mm + "/" + yyyy);
            return dtStr;
        }

        function getPriceSpan(f, lf) {
            var lpCls = 'lowestPrice';
            if (f != lf) {
                lpCls = '';
            }
            var str = '<span class="price ' + lpCls + '"><span class="RupeeSign">Rs.</span>' + getFormattedPrice(f) + '</span>';
            return str;
        }

        function getFormattedPrice(number) {
            var regexp = new RegExp(/(\d)(?=(\d\d\d)+(?!\d))/g)
            if (typeof number != 'undefined') {
                var fNumber = number.toString().replace(regexp, "$1,");
            }
            if (fNumber.length > 6) {
                return fNumber.substring(0, 1) + "," + fNumber.substring(1, fNumber.length);
            } else {
                return	number.toString().replace(regexp, "$1,");
            }
        }

    };

    this.on = function (type, cb) {
        if (callbackArr[type]) {
            callbackArr[type].push(cb);
        }
    }

    this.getCurrentState = function () {
        return {F: _this.fromDate, T: _this.toDate, M: _this.mode, modes: modes};
    };

    var _updateModeClasses = function () {
        if (_this.mode == modes.R && _this.fromDate != null && _this.toDate == null) {
            $('.' + clsNames.modes.container, holder).addClass(clsNames.modes.showReturn);
        }
        else {
            $('.' + clsNames.modes.container, holder).removeClass(clsNames.modes.showReturn);
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
            _updateInput(gethoverDS(this));


        });

        $('.js-month-container', holder).mouseleave(function () {
            _updateInput(_this.getCurrentState());
            _updateDayClasses();
        });

        function gethoverDS(ele) {
            var obj = {F: _this.fromDate, T: _this.toDate, M: _this.mode, modes: modes};
            var cur = ele.date;
            if ((!obj.F) || (obj.F && obj.T)) {
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

        $('a.' + clsNames.dayAnchor, holder).live('click', function (e) {
            e.preventDefault();
            if (settings.restrictDate.getTime() < this.date.getTime()) {
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

        $(settings.inputEle).focus(function () {
            var offset = $(this).offset();
            var top = offset.top + $(this).outerHeight();
            var left = offset.left - holder.outerWidth() / 2 + $(this).outerWidth() / 2;
            var cssSettings = {
                top: top,
                left: left
            };
            $(holder).css(cssSettings);
            $(holder).show();
        });

        $(document).mouseup(function (e) {
            var container = $(holder);
            if (!container.is(e.target) && !$(settings.inputEle).is(e.target) && container.has(e.target).length == 0) {
                _closeCalendar();
            }
        });


    };

    var _closeCalendar = function () {
        $(holder).fadeOut(200);
        $(settings.inputEle).blur();
    };

    var _generateHTML = function () {
        var head = $('<div class="cal-head"/>');
        var headL = $('<div class="head-left"/>');
        var headR = $('<div class="head-right"/>');

        headL.append('<label><input class="js-mode-type" type="radio" name="' + settings.holder + 'mode" value="R" checked="checked" />Round-trip</label>');
        headL.append('<label><input class="js-mode-type" type="radio" name="' + settings.holder + 'mode" value="O" />one way</label>');

        headR.append('<div class="">Select Departure Date</div>');
        headR.append('<div class="">Select Return Date</div>');
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

        $('body').append(holder);

//        console.log(head, body);
        holder.html('').append(head, body).addClass('pegasus-cal');
    };

    var _attachCallbacks = function () {
        _this.on('dateChange', function (res) {
            _updateInput(res);
        });

        _this.on('modeChange', function (res) {
            _updateInput(res);
        });
    };

    var _updateInput = function (obj) {
        var str = '';
        if (obj.F) {
            str = getDateStr(obj.F);
            if (obj.M == obj.modes.R) {
                str += ' to ';
                if (obj.T != null) {
                    str += getDateStr(obj.T);
                }
                else {
                    str += 'Return date';
                }
            }
        }
        $(settings.inputEle).val(str);
        function getDateStr(date) {
            return (date.getDate() + ' ' + monthNames[date.getMonth()].slice(0, 3));
        }
    };

    var _clearInputCache = function () {
        $(settings.inputEle).val('');
    };

    _init();

    PegasusCalendar.prototype.count++;
}

PegasusCalendar.prototype.count = 0;


