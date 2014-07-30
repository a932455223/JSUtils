/**
 * @file 选项卡组件
 * @import extend/touch.js, core/widget.js, extend/highlight.js, extend/event.ortchange.js
 * @importCSS transitions.css, loading.css
 * @module GMU
 */

(function( gmu, $, undefined ) {
    var _uid = 1,
        uid = function(){
            return _uid++;
        },
        idRE = /^#(.+)$/;

    /**
     * 选项卡组件
     *
     * @class Tabs
     * @constructor Html部分
     * ```html
     * <div id="tabs">
     *      <ul>
     *         <li><a href="#conten1">Tab1</a></li>
     *         <li><a href="#conten2">Tab2</a></li>
     *         <li><a href="#conten3">Tab3</a></li>
     *     </ul>
     *     <div id="conten1">content1</div>
     *     <div id="conten2"><input type="checkbox" id="input1" /><label for="input1">选中我后tabs不可切换</label></div>
     *     <div id="conten3">content3</div>
     * </div>
     * ```
     *
     * javascript部分
     * ```javascript
     * $('#tabs').tabs();
     * ```
     * @param {dom | zepto | selector} [el] 用来初始化Tab的元素
     * @param {Object} [options] 组件配置项。具体参数请查看[Options](#GMU:Tabs:options)
     * @grammar $( el ).tabs( options ) => zepto
     * @grammar new gmu.Tabs( el, options ) => instance
     */
    gmu.define( 'Tabs', {
        options: {

            /**
             * @property {Number} [active=0] 初始时哪个为选中状态，如果时setup模式，如果第2个li上加了ui-state-active样式时，active值为1
             * @namespace options
             */
            active: 0,

            /**
             * @property {Array} [items=null] 在render模式下需要必须设置 格式为\[{title:\'\', content:\'\', href:\'\'}\], href可以不设，可以用来设置ajax内容
             * @namespace options
             */
            items:null,

            /**
             * @property {String} [transition='slide'] 设置切换动画，目前只支持slide动画，或无动画
             * @namespace options
             */
            transition: 'slide'
        },

        template: {
            nav:'<ul class="ui-tabs-nav">'+
                '<% var item; for(var i=0, length=items.length; i<length; i++) { item=items[i]; %>'+
                    '<li<% if(i==active){ %> class="ui-state-active"<% } %>><a href="javascript:;"><%=item.title%></a></li>'+
                '<% } %></ul>',
            content:'<div class="ui-viewport ui-tabs-content">' +
                '<% var item; for(var i=0, length=items.length; i<length; i++) { item=items[i]; %>'+
                    '<div<% if(item.id){ %> id="<%=item.id%>"<% } %> class="ui-tabs-panel <%=transition%><% if(i==active){ %> ui-state-active<% } %>"><%=item.content%></div>'+
                '<% } %></div>'
        },

        _init:function () {
            var me = this, _opts = me._options, $el, eventHandler = $.proxy(me._eventHandler, me);

            me.on( 'ready', function(){
                $el = me.$el;
                $el.addClass('ui-tabs');
                _opts._nav.on('tap', eventHandler).children().highlight('ui-state-hover');
            } );

            $(window).on('ortchange', eventHandler);
        },

        _create:function () {
            var me = this, _opts = me._options;

            if( me._options.setup && me.$el.children().length > 0 ) {
                me._prepareDom('setup', _opts);
            } else {
                _opts.setup = false;
                me.$el = me.$el || $('<div></div>');
                me._prepareDom('create', _opts);
            }
        },

        _prepareDom:function (mode, _opts) {
            var me = this, content, $el = me.$el, items, nav, contents, id;
            switch (mode) {
                case 'setup':
                    _opts._nav =  me._findElement('ul').first();
                    if(_opts._nav) {
                        _opts._content = me._findElement('div.ui-tabs-content');
                        _opts._content = ((_opts._content && _opts._content.first()) || $('<div></div>').appendTo($el)).addClass('ui-viewport ui-tabs-content');
                        items = [];
                        _opts._nav.addClass('ui-tabs-nav').children().each(function(){
                            var $a = me._findElement('a', this), href = $a?$a.attr('href'):$(this).attr('data-url'), id, $content;
                            id = idRE.test(href)? RegExp.$1: 'tabs_'+uid();
                            ($content = me._findElement('#'+id) || $('<div id="'+id+'"></div>'))
                                .addClass('ui-tabs-panel'+(_opts.transition?' '+_opts.transition:''))
                                .appendTo(_opts._content);
                            items.push({
                                id: id,
                                href: href,
                                title: $a?$a.attr('href', 'javascript:;').text():$(this).text(),//如果href不删除的话，地址栏会出现，然后一会又消失。
                                content: $content
                            });
                        });
                        _opts.items = items;
                        _opts.active = Math.max(0, Math.min(items.length-1, _opts.active || $('.ui-state-active', _opts._nav).index()||0));
                        me._getPanel().add(_opts._nav.children().eq(_opts.active)).addClass('ui-state-active');
                        break;
                    } //if cannot find the ul, switch this to create mode. Doing this by remove the break centence.
                default:
                    items = _opts.items = _opts.items || [];
                    nav = [];
                    contents = [];
                    _opts.active = Math.max(0, Math.min(items.length-1, _opts.active));
                    $.each(items, function(key, val){
                        id = 'tabs_'+uid();
                        nav.push({
                            href: val.href || '#'+id,
                            title: val.title
                        });
                        contents.push({
                            content: val.content || '',
                            id: id
                        });
                        items[key].id = id;
                    });
                    _opts._nav = $( this.tpl2html( 'nav', {items: nav, active: _opts.active} ) ).prependTo($el);
                    _opts._content = $( this.tpl2html( 'content', {items: contents, active: _opts.active, transition: _opts.transition} ) ).appendTo($el);
                    _opts.container = _opts.container || ($el.parent().length ? null : 'body');
            }
            _opts.container && $el.appendTo(_opts.container);
            me._fitToContent(me._getPanel());
        },

        _getPanel: function(index){
            var _opts = this._options;
            return $('#' + _opts.items[index === undefined ? _opts.active : index].id);
        },

        _findElement:function (selector, el) {
            var ret = $(el || this.$el).find(selector);
            return ret.length ? ret : null;
        },

        _eventHandler:function (e) {
            var match, _opts = this._options;
            switch(e.type) {
                case 'ortchange':
                    this.refresh();
                    break;
                default:
                    if((match = $(e.target).closest('li', _opts._nav.get(0))) && match.length) {
                        e.preventDefault();
                        this.switchTo(match.index());
                    }
            }
        },

        _fitToContent: function(div) {
            var _opts = this._options, $content = _opts._content;
            _opts._plus === undefined && (_opts._plus = parseFloat($content.css('border-top-width'))+parseFloat($content.css('border-bottom-width')))
            $content.height( div.height() + _opts._plus);
            return this;
        },

        /**
         * 切换到某个Tab
         * @method switchTo
         * @param {Number} index Tab编号
         * @chainable
         * @return {self} 返回本身。
         */
        switchTo: function(index) {
            var me = this, _opts = me._options, items = _opts.items, eventData, to, from, reverse, endEvent;
            if(!_opts._buzy && _opts.active != (index = Math.max(0, Math.min(items.length-1, index)))) {
                to = $.extend({}, items[index]);//copy it.
                to.div = me._getPanel(index);
                to.index = index;

                from = $.extend({}, items[_opts.active]);//copy it.
                from.div = me._getPanel();
                from.index = _opts.active;

                eventData = gmu.Event('beforeActivate');
                me.trigger(eventData, to, from);
                if(eventData.isDefaultPrevented()) return me;

                _opts._content.children().removeClass('ui-state-active');
                to.div.addClass('ui-state-active');
                _opts._nav.children().removeClass('ui-state-active').eq(to.index).addClass('ui-state-active');
                if(_opts.transition) { //use transition
                    _opts._buzy = true;
                    endEvent = $.fx.animationEnd + '.tabs';
                    reverse = index>_opts.active?'':' reverse';
                    _opts._content.addClass('ui-viewport-transitioning');
                    from.div.addClass('out'+reverse);
                    to.div.addClass('in'+reverse).on(endEvent, function(e){
                        if (e.target != e.currentTarget) return //如果是冒泡上来的，则不操作
                        to.div.off(endEvent, arguments.callee);//解除绑定
                        _opts._buzy = false;
                        from.div.removeClass('out reverse');
                        to.div.removeClass('in reverse');
                        _opts._content.removeClass('ui-viewport-transitioning');
                        me.trigger('animateComplete', to, from);
                        me._fitToContent(to.div);
                    });
                }
                _opts.active = index;
                me.trigger('activate', to, from);
                _opts.transition ||  me._fitToContent(to.div);
            }
            return me;
        },

        /**
         * 当外部修改tabs内容好，需要调用refresh让tabs自动更新高度
         * @method refresh
         * @chainable
         * @return {self} 返回本身。
         */
        refresh: function(){
            return this._fitToContent(this._getPanel());
        },

        /**
         * 销毁组件
         * @method destroy
         */
        destroy:function () {
            var _opts = this._options, eventHandler = this._eventHandler;
            _opts._nav.off('tap', eventHandler).children().highlight();
            _opts.swipe && _opts._content.off('swipeLeft swipeRight', eventHandler);

            if( !_opts.setup ) {
                this.$el.remove();
            }
            return this.$super('destroy');
        }

        /**
         * @event ready
         * @param {Event} e gmu.Event对象
         * @description 当组件初始化完后触发。
         */

        /**
         * @event beforeActivate
         * @param {Event} e gmu.Event对象
         * @param {Object} to 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @param {Object} from 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @description 内容切换之前触发，可以通过e.preventDefault()来阻止
         */

        /**
         * @event activate
         * @param {Event} e gmu.Event对象
         * @param {Object} to 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @param {Object} from 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @description 内容切换之后触发
         */

        /**
         * @event animateComplete
         * @param {Event} e gmu.Event对象
         * @param {Object} to 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @param {Object} from 包含如下属性：div(内容div), index(位置), title(标题), content(内容), href(链接)
         * @description 动画完成后执行，如果没有设置动画，此时间不会触发
         */

        /**
         * @event destroy
         * @param {Event} e gmu.Event对象
         * @description 组件在销毁的时候触发
         */
    });
})( gmu, gmu.$ );
/**
 * @file 左右滑动手势插件
 * @import widget/tabs/tabs.js
 */

(function ($, undefined) {
    var durationThreshold = 1000, // 时间大于1s就不算。
        horizontalDistanceThreshold = 30, // x方向必须大于30
        verticalDistanceThreshold = 70, // y方向上只要大于70就不算
        scrollSupressionThreshold = 30, //如果x方向移动大于这个直就禁掉滚动
        tabs = [],
        eventBinded = false,
        isFromTabs = function (target) {
            for (var i = tabs.length; i--;) {
                if ($.contains(tabs[i], target)) return true;
            }
            return false;
        }

    function tabsSwipeEvents() {
        $(document).on('touchstart.tabs', function (e) {
            var point = e.touches ? e.touches[0] : e, start, stop;

            start = {
                x:point.clientX,
                y:point.clientY,
                time:Date.now(),
                el:$(e.target)
            }

            $(document).on('touchmove.tabs',function (e) {
                var point = e.touches ? e.touches[0] : e, xDelta;
                if (!start)return;
                stop = {
                    x:point.clientX,
                    y:point.clientY,
                    time:Date.now()
                }
                if ((xDelta = Math.abs(start.x - stop.x)) > scrollSupressionThreshold ||
                    xDelta > Math.abs(start.y - stop.y)) {
                    isFromTabs(e.target) && e.preventDefault();
                } else {//如果系统滚动开始了，就不触发swipe事件
                    $(document).off('touchmove.tabs touchend.tabs');
                }
            }).one('touchend.tabs', function () {
                    $(document).off('touchmove.tabs');
                    if (start && stop) {
                        if (stop.time - start.time < durationThreshold &&
                            Math.abs(start.x - stop.x) > horizontalDistanceThreshold &&
                            Math.abs(start.y - stop.y) < verticalDistanceThreshold) {
                            start.el.trigger(start.x > stop.x ? "tabsSwipeLeft" : "tabsSwipeRight");
                        }
                    }
                    start = stop = undefined;
                });
        });
    }
    
    /**
     * 添加 swipe功能，zepto的swipeLeft, swipeRight不太准，所以在这另外实现了一套。
     * @class swipe
     * @namespace Tabs
     * @pluginfor Tabs
     */
    gmu.Tabs.register( 'swipe', {
        _init:function () {
            var _opts = this._options;

            this.on( 'ready', function(){
                tabs.push(_opts._content.get(0));
                eventBinded =  eventBinded || (tabsSwipeEvents(), true);
                this.$el.on('tabsSwipeLeft tabsSwipeRight', $.proxy(this._eventHandler, this));
            } );
        },
        _eventHandler:function (e) {
            var _opts = this._options, items, index;
            switch (e.type) {
                case 'tabsSwipeLeft':
                case 'tabsSwipeRight':
                    items = _opts.items;
                    if (e.type == 'tabsSwipeLeft' && _opts.active < items.length - 1) {
                        index = _opts.active + 1;
                    } else if (e.type == 'tabsSwipeRight' && _opts.active > 0) {
                        index = _opts.active - 1;
                    }
                    index !== undefined && (e.stopPropagation(), this.switchTo(index));
                    break;
                default://tap
                    return this.origin(e);
            }
        },
        destroy: function(){
            var _opts = this._options, idx;
            ~(idx = $.inArray(_opts._content.get(0), tabs)) && tabs.splice(idx, 1);
            this.$el.off('tabsSwipeLeft tabsSwipeRight', this._eventHandler);
            tabs.length || ($(document).off('touchstart.tabs'), eventBinded = false);
            return this.origin();
        }
    } );
})(Zepto);
/**
 * @file ajax插件
 * @import widget/tabs/tabs.js
 */
(function ($, undefined) {
    var idRE = /^#.+$/,
        loaded = {},
        tpl = {
            loading: '<div class="ui-loading">Loading</div>',
            error: '<p class="ui-load-error">内容加载失败!</p>'
        };

    /**
     * 在a上面href设置的是地址，而不是id，则组件认为这个为ajax类型的。在options上传入ajax对象可以配置[ajax选项](#$.ajax)
     * @class ajax
     * @namespace Tabs
     * @pluginfor Tabs
     */
    gmu.Tabs.register( 'ajax', {
        _init:function () {
            var _opts = this._options, items, i, length;

            this.on( 'ready', function(){
                items = _opts.items;
                for (i = 0, length = items.length; i < length; i++) {
                    items[i].href && !idRE.test(items[i].href) && (items[i].isAjax = true);
                }
                this.on('activate', this._onActivate);
                items[_opts.active].isAjax && this.load(_opts.active);//如果当前是ajax
            } );
        },

        destroy:function () {
            this.off('activate', this._onActivate);
            this.xhr && this.xhr.abort();
            return this.origin();
        },

        _fitToContent: function(div) {
            var _opts = this._options;

            if(!_opts._fitLock)return this.origin(div);
        },

        _onActivate:function (e, to) {
            to.isAjax && this.load(to.index);
        },

        /**
         * 加载内容，指定的tab必须是ajax类型。加载的内容会缓存起来，如果要强行再次加载，第二个参数传入true
         * @method load
         * @param {Number} index Tab编号
         * @param {Boolean} [force=false] 是否强制重新加载
         * @for Tabs
         * @uses Tabs.ajax
         * @return {self} 返回本身。
         */
        load:function (index, force) {
            var me = this, _opts = me._options, items = _opts.items, item, $panel, prevXHR;

            if (index < 0 ||
                index > items.length - 1 ||
                !(item = items[index]) || //如果范围错误
                !item.isAjax || //如果不是ajax类型的
                ( ( $panel = me._getPanel(index)).text() && !force && loaded[index] ) //如果没有加载过，并且tab内容为空
                )return this;

            (prevXHR = me.xhr) && setTimeout(function(){//把切出去没有加载玩的xhr abort了
                prevXHR.abort();
            }, 400);

            _opts._loadingTimer = setTimeout(function () {//如果加载在50ms内完成了，就没必要再去显示 loading了
                $panel.html(tpl.loading);
            }, 50);

            _opts._fitLock = true;

            me.xhr = $.ajax($.extend(_opts.ajax || {}, {
                url:item.href,
                context:me.$el.get(0),
                beforeSend:function (xhr, settings) {
                    var eventData = gmu.Event('beforeLoad');
                    me.trigger(eventData, xhr, settings);
                    if (eventData.isDefaultPrevented())return false;
                },
                success:function (response, xhr) {
                    var eventData = gmu.Event('beforeRender');
                    clearTimeout(_opts._loadingTimer);//清除显示loading的计时器
                    me.trigger(eventData, response, $panel, index, xhr)//外部可以修改data，或者直接把pannel修改了
                    if (!eventData.isDefaultPrevented()) {
                        $panel.html(response);
                    }
                    _opts._fitLock = false;
                    loaded[index] = true;
                    me.trigger('load', $panel);
                    delete me.xhr;
                    me._fitToContent($panel);
                },
                error:function () {
                    var eventData = gmu.Event('loadError');
                    clearTimeout(_opts._loadingTimer);//清除显示loading的计时器
                    loaded[index] = false;
                    me.trigger(eventData, $panel);
                    if(!eventData.isDefaultPrevented()){
                        $panel.html(tpl.error);
                    }
                    delete me.xhr;
                }
            }));
        }
        
        /**
         * @event beforeLoad
         * @param {Event} e gmu.Event对象
         * @param {Object} xhr xhr对象
         * @param {Object} settings ajax请求的参数
         * @description 在请求前触发，可以通过e.preventDefault()来取消此次ajax请求
         * @for Tabs
         * @uses Tabs.ajax
         */
        
        /**
         * @event beforeRender
         * @param {Event} e gmu.Event对象
         * @param {Object} response 返回值
         * @param {Object} panel 对应的Tab内容的容器
         * @param {Number} index Tab的序号
         * @param {Object} xhr xhr对象
         * @description ajax请求进来数据，在render到div上之前触发，对于json数据，可以通过此方来自行写render，然后通过e.preventDefault()来阻止，将response输出在div上
         * @for Tabs
         * @uses Tabs.ajax
         */
        
        /**
         * @event load
         * @param {Event} e gmu.Event对象
         * @param {Zepto} panel 对应的Tab内容的容器
         * @description 当ajax请求到的内容过来后，平已经Render到div上了后触发
         * @for Tabs
         * @uses Tabs.ajax
         */
        
        /**
         * @event loadError
         * @param {Event} e gmu.Event对象
         * @param {Zepto} panel 对应的Tab内容的容器
         * @description 当ajax请求内容失败时触发，如果此事件被preventDefault了，则不会把自带的错误信息Render到div上
         * @for Tabs
         * @uses Tabs.ajax
         */
    } );
})(Zepto);
