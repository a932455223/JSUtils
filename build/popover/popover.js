/**
 * @file 弹出层组件, 基础版本。
 * @import core/widget.js
 * @module GMU
 */
(function( gmu, $, undefined ) {

    /**
     * 弹出层组件，具有点击按钮在周围弹出层的交互效果。至于弹出层内容，可以通过`content`直接设置内容，
     * 也可以通过`container`设置容器节点。按钮和弹出层之间没有位置依赖。
     *
     * 基础版本只有简单的点击显示，再点击隐藏功能。像用更多的功能请参看[插件介绍](#GMU:Popover:plugins)部分.
     *
     * @class Popover
     * @constructor Html部分
     * ```html
     * <a id="btn">按钮<a/>
     * ```
     *
     * javascript部分
     * ```javascript
     * $('#btn').popover({
     *     content: 'Hello world'
     * });
     * ```
     * @param {dom | zepto | selector} [el] 按钮节点
     * @param {Object} [options] 组件配置项。具体参数请查看[Options](#GMU:Popover:options)
     * @grammar $( el ).popover( options ) => zepto
     * @grammar new gmu.Popover( el, options ) => instance
     */
    gmu.define( 'Popover', {

        // 默认配置项。
        options: {

            /**
             * @property {Zepto | Selector} [container] 指定容器，如果不传入，组件将在el的后面自动创建一个。
             * @namespace options
             */
            container: null,

            /**
             * @property {String | Zepto | Selector } [content] 弹出框的内容。
             * @namespace options
             */
            content: null,

            /**
             * @property {String} [event="click"] 交互事件名, 可能你会设置成tap。
             * @namespace options
             */
            event: 'click'
        },

        template: {
            frame: '<div>'
        },

        /**
         * @event ready
         * @param {Event} e gmu.Event对象
         * @description 当组件初始化完后触发。
         */

         // 负责dom的创建。
        _create: function() {
            var me = this,
                opts = me._options,
                $el = opts.target && $( opts.target ) || me.getEl(),
                $root = opts.container && $( opts.container );

            // 没传 或者 就算传入了选择器，但是没有找到节点，还是得创建一个。
            $root && $root.length || ($root = $( me.tpl2html( 'frame' ) )
                    .addClass( 'ui-mark-temp' ));
            me.$root = $root;

            // 如果传入了content, 则作为内容插入到container中
            opts.content && me.setContent( opts.content );
            me.trigger( 'done.dom', $root.addClass( 'ui-' + me.widgetName ),
                    opts );

            // 如果节点是动态创建的，则不在文档树中，就把节点插入到$el后面。
            $root.parent().length || $el.after( $root );

            me.target( $el );
        },

        // 删除标记为组件临时的dom
        _checkTemp: function( $el ) {
            $el.is( '.ui-mark-temp' ) && $el.off( this.eventNs ) &&
                    $el.remove();
        },

        /**
         * @event beforeshow
         * @param {Event} e gmu.Event对象
         * @description 但弹出层打算显示时触发，可以通过`e.preventDefault()`来阻止。
         */


        /**
         * @event show
         * @param {Event} e gmu.Event对象
         * @description 当弹出层显示后触发。
         */


        /**
         * 显示弹出层。
         * @method show
         * @chainable
         * @return {self} 返回本身。
         */
        show: function() {
            var me = this,
                evt = gmu.Event( 'beforeshow' );

            me.trigger( evt );

            // 如果外部阻止了关闭，则什么也不做。
            if ( evt.isDefaultPrevented() ) {
                return;
            }

            me.trigger( 'placement', me.$root.addClass( 'ui-in' ), me.$target );
            me._visible = true;
            return me.trigger( 'show' );
        },

        /**
         * @event beforehide
         * @param {Event} e gmu.Event对象
         * @description 但弹出层打算隐藏时触发，可以通过`e.preventDefault()`来阻止。
         */


        /**
         * @event hide
         * @param {Event} e gmu.Event对象
         * @description 当弹出层隐藏后触发。
         */

        /**
         * 隐藏弹出层。
         * @method hide
         * @chainable
         * @return {self} 返回本身。
         */
        hide: function() {
            var me = this,
                evt = new gmu.Event( 'beforehide' );

            me.trigger( evt );

            // 如果外部阻止了关闭，则什么也不做。
            if ( evt.isDefaultPrevented() ) {
                return;
            }

            me.$root.removeClass( 'ui-in' );
            me._visible = false;
            return me.trigger( 'hide' );
        },

        /**
         * 切换弹出层的显示和隐藏。
         * @method toggle
         * @chainable
         * @return {self} 返回本身。
         */
        toggle: function() {
            var me = this;
            return me[ me._visible ? 'hide' : 'show' ].apply( me, arguments );
        },

        /**
         * 设置或者获取当前`按钮`(被点击的对象)。
         * @method target
         * @param {dom | selector | zepto} [el] target新值。
         * @chainable
         * @return {self} 当传入了el时，此方法为setter, 返回值为self.
         * @return {dom} 当没有传入el时，为getter, 返回当前target值。
         */
        target: function( el ) {

            // getter
            if ( el === undefined ) {
                return this.$target;
            }

            // setter
            var me = this,
                $el = $( el ),
                orig = me.$target,
                click = me._options.event + me.eventNs;

            orig && orig.off( click );

            // 绑定事件
            me.$target = $el.on( click, function( e ) {
                e.preventDefault();
                me.toggle();
            } );

            return me;
        },

        /**
         * 设置当前容器内容。
         * @method setContent
         * @param {dom | selector | zepto} [value] 容器内容
         * @chainable
         * @return {self} 组件本身。
         */
        setContent: function( val ) {
            var container = this.$root;
            container.empty().append( val );
            return this;
        },

        /**
         * 销毁组件，包括事件销毁和删除自动创建的dom.
         * @method destroy
         * @chainable
         * @return {self} 组件本身。
         */
        destroy: function() {
            var me = this;

            me.$target.off( me.eventNs );
            me._checkTemp( me.$root );
            return me.$super( 'destroy' );
        }
    } );
})( gmu, gmu.$ );
/**
 * @file 简单版定位
 * @import widget/popover/popover.js, extend/offset.js
 */
(function( gmu, $ ) {

    /**
     * @property {String} [placement="bottom"] 设置定位位置。
     * @namespace options
     * @uses Popover.placement
     * @for Popover
     */

    /**
     * @property {Object|Function} [offset=null] 设置偏移量。
     * @namespace options
     * @for Popover
     * @uses Popover.placement
     */
    $.extend( gmu.Popover.options, {
        placement: 'bottom',    // 默认让其在下方显示
        offset: null
    } );

    /**
     * 支持弹出层相对于按钮上下左右定位。
     * @class placement
     * @namespace Popover
     * @pluginfor Popover
     */
    gmu.Popover.option( 'placement', function( val ) {
        return ~[ 'top', 'bottom', 'left', 'right' ].indexOf( val );
    }, function() {

        var me = this,

            // 第一个值：相对于目标位置的水平位置
            // 第二个值：相对于目标位置的垂直位置
            // 第三个值：中心点的水平位置
            // 第四个值：中心点的垂直位置
            config = {
                'top': 'center top center bottom',
                'right': 'right center left center',
                'bottom': 'center bottom center top',
                'left': 'left center right center'
            },
            presets = {},    // 支持的定位方式。

            info;

        // 根据配置项生成方法。
        $.each( config, function( preset, args ) {
            args = args.split( /\s/g );
            args.unshift( preset );
            presets[ preset ] = function() {
                return placement.apply( null, args );
            };
        } );

        function getPos( pos, len ) {
            return pos === 'right' || pos === 'bottom' ? len :
                        pos === 'center' ? len / 2 : 0;
        }

        // 暂时用简单的方式实现，以后考虑采用position.js
        function placement( preset, atH, atV, myH, myV ) {
            var of = info.of,
                coord = info.coord,
                offset = info.offset,
                top = of.top,
                left = of.left;

            left += getPos( atH, of.width ) - getPos( myH, coord.width );
            top += getPos( atV, of.height ) - getPos( myV, coord.height );

            // offset可以是fn
            offset = typeof offset === 'function' ? offset.call( null, {
                left: left,
                top: top
            }, preset ) : offset || {};

            return {
                left: left + (offset.left || 0),
                top: top + (offset.top || 0)
            };
        }

        // 此事件在
        this.on( 'placement', function( e, $el, $of ) {
            var me = this,
                opts = me._options,
                placement = opts.placement,
                coord;

            info = {
                coord: $el.offset(),
                of: $of.offset(),
                placement: placement,
                $el: $el,
                $of: $of,
                offset: opts.offset
            };

            // 设置初始值
            coord = presets[ placement ]();

            // 提供机会在设置之前修改位置
            me.trigger( 'before.placement', coord, info, presets );
            info.preset && (info.placement = info.preset);
            $el.offset( coord );

            // 提供给arrow位置定位用
            me.trigger( 'after.placement', coord, info );
        } );

        // 当屏幕旋转的时候需要需要重新计算。
        $( window ).on( 'ortchange', function() {
            me._visible && me.trigger( 'placement', me.$target, me.$root );
        } );
    } );
})( gmu, gmu.$ );
/**
 * @file 是否现实剪头
 * @import widget/popover/popover.js
 */
(function( gmu ) {
    var Popover = gmu.Popover;

    Popover.template.arrow = '<span class="ui-arrow"></span>';

    /**
     * @property {Boolean} [arrow=true] 是否显示剪头
     * @namespace options
     * @for Popover
     * @uses Popover.arrow
     */
    Popover.options.arrow = true;    // 默认开启arrow

    /**
     * 扩展Popover显示剪头功能。当此文件引入后，Popover实例将自动开启显示剪头。
     * 剪头的位置会根据不同的placement显示在不同的位置。
     * @class arrow
     * @namespace Popover
     * @pluginfor Popover
     */
    Popover.option( 'arrow', true, function() {
        var me = this,
            opts = me._options;

        // 在没有传入offset的时候，默认有arrow就会多10px偏移
        opts.offset = opts.offset || function( coord, placement ) {
            placement = placement.split( '_' )[ 0 ];
            return {
                left: (placement === 'left' ? -1 :
                        placement === 'right' ? 1 : 0) * 15,
                top: (placement === 'top' ? -1 :
                        placement === 'bottom' ? 1 : 0) * 15
            };
        };

        me.on( 'done.dom', function( e, $root ) {
            $root.append( me.tpl2html( 'arrow' ) ).addClass( 'ui-pos-default' );
        } );

        me.on( 'after.placement', function( e, coord, info ) {
            var root = this.$root[ 0 ],
                cls = root.className,
                placement = info.placement,
                align = info.align || '';

            root.className = cls.replace( /(?:\s|^)ui-pos-[^\s$]+/g, '' ) +
                ' ui-pos-' + placement + (align ? '-' + align : '');
        } );
    } );
})( gmu );
/**
 * @file 碰撞检测，根据指定的容器，做最优位置显示
 * @import widget/popover/popover.js
 */
(function( gmu, $ ) {

    /**
     * @property {Boolean} [collision=true] 开启碰撞检测。
     * @namespace options
     * @uses Popover.collision
     * @for Popover
     */
    gmu.Popover.options.collision = true;

    /**
     * 碰撞检测，依赖于placement插件，根据是否能完全显示内容的策略，挑选最合适的placement.
     * @class collision
     * @namespace Popover
     * @pluginfor Popover
     */
    gmu.Popover.option( 'collision', true, function() {
        var me = this,
            opts = me._options;

        // 获取within坐标信息
        // 可以是window, document或者element.
        // within为碰撞检测的容器。
        function getWithinInfo( raw ) {
            var $el = $( raw );

            raw = $el[ 0 ];

            if ( raw !== window && raw.nodeType !== 9 ) {
                return $el.offset();
            }

            return {
                width: $el.width(),
                height: $el.height(),
                top: raw.pageYOffset || raw.scrollTop || 0,
                left: raw.pageXOffset || raw.scrollLeft || 0
            };
        }

        // 判断是否没被挡住
        function isInside( coord, width, height, within ) {
            return coord.left >= within.left &&
                    coord.left + width <= within.left + within.width &&
                    coord.top >= within.top &&
                    coord.top + height <= within.top + within.height;
        }

        // 此事件来源于placement.js, 主要用来修改定位最终值。
        me.on( 'before.placement', function( e, coord, info, presets ) {
            var within = getWithinInfo( opts.within || window ),
                now = info.placement,
                orig = info.coord,
                aviable = Object.keys( presets ),
                idx = aviable.indexOf( now ) + 1,
                swap = aviable.splice( idx, aviable.length - idx );

            // 从当前placement的下一个开始，最多尝试一圈。
            // 如果有完全没有被挡住的位置，则跳出循环
            // 如果尝试一圈都没有合适的位置，还是用原来的初始位置定位
            aviable = swap.concat( aviable );

            while ( aviable.length && !isInside( coord, orig.width,
                    orig.height, within ) ) {
                now = aviable.shift();
                $.extend( coord, presets[ now ]() );
            }
            info.preset = now;
        } );
    } );
})( gmu, gmu.$ );
/**
 * @file 是否点击其他区域，关闭自己
 * @import widget/popover/popover.js
 */
(function( gmu, $ ) {
    var Popover = gmu.Popover;

    /**
     * @property {Boolean} [dismissible=true] 是否点击其他区域，关闭自己.
     * @namespace options
     * @uses Popover.dismissible
     * @for Popover
     */
    Popover.options.dismissible = true;

    /**
     * 用来实现自动关闭功能，在弹出层打开的条件下，点击其他位置，将自动关闭此弹出层。
     * 此功能包括多个实例间的互斥功能。
     * @class dismissible
     * @namespace Popover
     * @pluginfor Popover
     */
    Popover.option( 'dismissible', true, function() {
        var me = this,
            $doc = $( document ),
            click = 'click' + me.eventNs;

        function isFromSelf( target ) {
            var doms = me.$target.add( me.$root ).get(),
                i = doms.length;

            while ( i-- ) {
                if ( doms[ i ] === target ||
                        $.contains( doms[ i ], target ) ) {
                    return true;
                }
            }
            return false;
        }

        me.on( 'show', function() {
            $doc.off( click ).on( click, function( e ) {
                isFromSelf( e.target ) || me.hide();
            } );
        } );

        me.on( 'hide', function() {
            $doc.off( click );
        } );
    } );
})( gmu, gmu.$ );