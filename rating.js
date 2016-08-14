/**
 * Variable Star Rating
 *
 * ver 0.3.0
 *
 * (c) Vitalii Omelkin, 2015, 2016
 * Licensed under the MIT License
 *
 */
;(function(){
    var rating = angular.module('stars', []);

    rating.controller("starsController", function ($scope) {
        // Default graphic items -- stars
    });

    rating.controller("circlesController", function ($scope) {
        // Circle graphic items function
        $scope.circleDrawer = function (ctx, r) {
            if (!ctx) throw Error('No Canvas context found!');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(r, r, r, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.restore();
        }
    });

    rating.factory('stars', [function() {

        /**
         * Draw wrapping rectangle
         *
         * @param ctx {Object} 2d context
         * @param dim {Number}
         * @param backColor {String}
         */
        function _drawRect(ctx, dim, backColor) {
            if (!ctx) throw Error('No Canvas context found!');
            ctx.save();
            ctx.width = dim;
            ctx.height = dim;
            ctx.fillStyle = backColor;
            ctx.fillRect(0,0, dim, dim);
            ctx.restore();
        }

        /**
         * Draw one star with certain general params
         *
         * @param empty {Boolean} Draw transparent or filled star
         * @param ctx {Object} 2d context
         * @param x {Number}
         * @param y {Number}
         * @param r {Number}
         * @param p {Number}
         * @param m {Number}
         * @param style {String} Star background color (in case of filled star)
         * @private
         */
        function _star(empty, ctx, x, y, r, p, m, style) {
            if (!ctx) throw Error('No Canvas context found!');
            ctx.save();

            if (empty) {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.fillStyle = style || 'gold';
            }

            ctx.beginPath();
            ctx.translate(x, y);
            ctx.moveTo(0,0-r);
            for (var i = 0; i < p; i++) {
                ctx.rotate(Math.PI / p);
                ctx.lineTo(0, 0 - (r*m));
                ctx.rotate(Math.PI / p);
                ctx.lineTo(0, 0 - r);
            }
            ctx.fill();
            ctx.restore();
        }

        // Draw one empty star
        function drawRatingElement(ctx, r, rectBackColor, ratingElDrawerFunc) {
            _drawRect(ctx, r*2, rectBackColor);
            if (typeof ratingElDrawerFunc === 'function') {
                ratingElDrawerFunc(ctx, r); // draw custom figure
            } else {
                _star(true, ctx, r, r, r, 5, 0.5); // draw star as a default image
            }
            
        }

        // Current API
        return {
            drawRatingElement: drawRatingElement
        }
    }]);

    rating.factory('starsUtility', [function() {
        /**
         * Creates an array with index values
         *
         * @param n {Number}
         * @returns {Array}
         */
        var createRange = function(n) {
            var i = 0;
            var range = new Array(n);
            while(i < n) {
                range[i++] = i;
            }
            return range;
        };

        /**
         * Calculate percent of area to filled with color star
         *
         * @param attrs {Object}
         * @returns {Number}
         */
        var calculatePercent = function(attrs) {
            var percent, stars, selectedStars;
            if (!attrs) {
                return 0;
            } else if (attrs.ratingPercent) {
                percent = parseInt(attrs.ratingPercent) ? parseInt(attrs.ratingPercent) : 0;
                return percent > 100 ? 100 : percent;
            } else if (attrs.ratingStars) {
                stars = parseInt(attrs.stars || 5);
                selectedStars = parseFloat(attrs.ratingStars) > stars ? stars : parseFloat(attrs.ratingStars);
                return (100 / stars) * selectedStars || 0.0;
            }
        };

        /**
         * Calculate how many stars should be filled (in percent)
         *
         * @param totalStars
         * @param totalWidth
         * @param starWidth
         * @param width
         * @returns {number}
         */
        var percentFullStars = function(totalStars, totalWidth, starWidth, width) {
            var pxPerOneStar = totalWidth / totalStars;
            var percentPerOneStar = 100 / totalStars;
            return Math.ceil(width / pxPerOneStar) * percentPerOneStar;
        };

        /**
         * Calculate stars in percents
         *
         * @param totalStars
         * @param percent
         * @param precision
         * @returns {string}
         */
        var starsByPercent = function(totalStars, percent, precision) {
            var percentPerOneStar = 100 / totalStars;
            return (percent / percentPerOneStar).toFixed(precision || 2);
        };

        return {
            createRange: createRange,
            calculatePercent: calculatePercent,
            percentFullStars: percentFullStars,
            starsByPercent: starsByPercent
        };
    }]);

    // ------------------------
    //        DIRECTIVE
    // ------------------------
    rating.directive('starRating', ['$compile', '$templateCache', '$timeout', function($compile, $templateCache, $timeout) {
        return {
            restrict: 'A',
            scope: {
                percent: "=outerPercent",
                starsSelected: "=outerStarSelection",
                customFigureDrawer: "="
            },
            template: '<div class="stars" ng-mousemove="changeRating($event)" ng-mouseleave="leaveRating()" ng-style="{\'background-color\': emptyBackColor}"><div class="stars-selected" ng-style="{\'width\': percent + \'%\', \'background-color\': selColor}"></div></div>',
            controller: function($scope, stars, starsUtility) {

                // Apply Utilities
                for(var method in starsUtility) {
                    (function(m) {
                        $scope[m] = function() { return starsUtility[m].apply(null, arguments); };
                    }(method));
                }

                // Invoke the factory method: draw transparent star
                $scope.drawStar = function() {
                    return stars.drawRatingElement.apply(null, arguments);
                };

            },
            link: function($scope, el, attrs) {
                // Configs
                var starEl = [];
                var wrapper = angular.element(el[0].querySelector('.stars'));
                var filler = angular.element(el[0].querySelector('.stars-selected'));

                $scope.howManyStars = $scope.createRange( attrs.stars ) || $scope.createRange(5);
                $scope.starRadius = parseInt( attrs.starRadius ) || 20;
                $scope.percent = $scope.prevPercent = $scope.calculatePercent( attrs );
                $scope.backColor = attrs.backColor || 'white';
                $scope.emptyBackColor = attrs.emptyBackColor || '#d3d3d3';
                $scope.selColor = attrs.selColor || 'gold';
                $scope.ratingDefine = attrs.ratingDefine || false;

                // Allowed to define a new rating?
                // -------------------------------
                if ($scope.ratingDefine) {

                    // watch percent value to update the view
                    $scope.$watch('percent', function(newValue) {
                        filler.css('width', newValue + '%');
                        $scope.starsSelected = $scope.starsByPercent($scope.howManyStars.length, $scope.percent);
                    });

                    // handle events to change the rating
                    $scope.changeRating = function(e) {
                        var el = wrapper[0];
                        var w = el.offsetWidth;
                        var selected = e.clientX - el.getBoundingClientRect().left + 1;
                        var newPercent = $scope.ratingDefine == 'star' ? $scope.percentFullStars($scope.howManyStars.length, w, $scope.starRadius*2, selected) : Math.floor((selected * 100) / w);
                        $scope.percent = newPercent > 100 ? 100 : newPercent;
                    };

                    $scope.leaveRating = function() {
                        $scope.percent = $scope.prevPercent;
                    };

                    $scope.secureNewRating = function() {
                        $scope.prevPercent = $scope.percent;
                    };
                }

                // add canvas to DOM first
                $scope.howManyStars.forEach(function() {
                    var star = angular.element('<canvas class="star" ng-click="secureNewRating()" height="{{starRadius*2}}" width="{{starRadius*2}}"></canvas>');
                    $compile(star)($scope);
                    wrapper.append(star);
                    starEl.push(star);
                });

                // we should wait for next JS 'tick' to show up the stars
                $timeout(function() {
                    starEl.forEach(function(el) {
                        $scope.drawStar(el[0].getContext("2d"), $scope.starRadius, $scope.backColor, $scope.customFigureDrawer);
                    });
                    wrapper.css('visibility', 'visible'); // this to avoid to show partly rendered layout
                });

            }
        };
    }]);
}());