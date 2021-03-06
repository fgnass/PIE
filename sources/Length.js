/**
 * Wrapper for length and percentage style values
 * @constructor
 * @param {string} val The CSS string representing the length. It is assumed that this will already have
 *                 been validated as a valid length or percentage syntax.
 */
PIE.Length = (function() {

    var lengthCalcEl = doc.createElement( 'length-calc' ),
        s = lengthCalcEl.style,
        numCache = {},
        unitCache = {};
    s.position = 'absolute';
    s.top = s.left = -9999;


    function Length( val ) {
        this.val = val;
    }

    Length.prototype = {
        /**
         * Regular expression for matching the length unit
         * @private
         */
        unitRE: /(px|em|ex|mm|cm|in|pt|pc|%)$/,

        /**
         * Get the numeric value of the length
         * @return {number} The value
         */
        getNumber: function() {
            var num = numCache[ this.val ],
                UNDEF;
            if( num === UNDEF ) {
                num = numCache[ this.val ] = parseFloat( this.val );
            }
            return num;
        },

        /**
         * Get the unit of the length
         * @return {string} The unit
         */
        getUnit: function() {
            var unit = unitCache[ this.val ], m;
            if( !unit ) {
                m = this.val.match( this.unitRE );
                unit = unitCache[ this.val ] = ( m && m[0] ) || 'px';
            }
            return unit;
        },

        /**
         * Determine whether this is a percentage length value
         * @return {boolean}
         */
        isPercentage: function() {
            return this.getUnit() === '%';
        },

        /**
         * Resolve this length into a number of pixels.
         * @param {Element} el - the context element, used to resolve font-relative values
         * @param {(function():number|number)=} pct100 - the number of pixels that equal a 100% percentage. This can be either a number or a
         *                  function which will be called to return the number.
         */
        pixels: function( el, pct100 ) {
            var num = this.getNumber(),
                unit = this.getUnit();
            switch( unit ) {
                case "px":
                    return num;
                case "%":
                    return num * ( typeof pct100 === 'function' ? pct100() : pct100 ) / 100;
                case "em":
                    return num * this.getEmPixels( el );
                case "ex":
                    return num * this.getEmPixels( el ) / 2;
                default:
                    return num * Length.conversions[ unit ];
            }
        },

        /**
         * The em and ex units are relative to the font-size of the current element,
         * however if the font-size is set using non-pixel units then we get that value
         * rather than a pixel conversion. To get around this, we keep a floating element
         * with width:1em which we insert into the target element and then read its offsetWidth.
         * But if the font-size *is* specified in pixels, then we use that directly to avoid
         * the expensive DOM manipulation.
         * @param el
         */
        getEmPixels: function( el ) {
            var fs = el.currentStyle.fontSize,
                px;

            if( fs.indexOf( 'px' ) > 0 ) {
                return parseFloat( fs );
            } else {
                lengthCalcEl.style.width = '1em';
                el.appendChild( lengthCalcEl );
                px = lengthCalcEl.offsetWidth;
                el.removeChild( lengthCalcEl );
                return px;
            }
        }
    };

    Length.conversions = (function() {
        var units = [ 'mm', 'cm', 'in', 'pt', 'pc' ],
            vals = {},
            parent = doc.documentElement,
            i = units.length, unit;

        parent.appendChild( lengthCalcEl );
        while( i-- ) {
            unit = units[i];
            lengthCalcEl.style.width = '100' + unit;
            vals[ unit ] = lengthCalcEl.offsetWidth / 100;
        }
        parent.removeChild( lengthCalcEl );
        return vals;
    })();

    Length.ZERO = new Length( '0' );

    return Length;
})();
