var Stats = require("./stats.js");
const Hilo3d = require('hilo3d');
//var OrbitControls = require("./OrbitControls.js");
var directionLight;

if (!window.game) {
    window.game = { ambientLight: null, camera: null, stage: null, renderer: null, gl: null, ticker: null, stats: null, canvas: null }

    window.game.camera = new Hilo3d.PerspectiveCamera({
        aspect: innerWidth / innerHeight,
        far: 1000,
        near: 0.1,
        z: 7,
        y: 10
    });

    window.game.stage = new Hilo3d.Stage({
        container: document.getElementById('container'),
        camera: window.game.camera,
        clearColor: new Hilo3d.Color(0.4, 0.4, 0.4),
        width: innerWidth,
        height: innerHeight
    });

    window.game.canvas = window.game.stage.canvas
    window.game.renderer = window.game.stage.renderer;
    window.game.canvas.oncontextmenu = function(e) { e.preventDefault(); e.stopPropagation(); }

    window.onresize = function(){
        window.game.camera.aspect = innerWidth / innerHeight;
        window.game.stage.resize(innerWidth, innerHeight);
    }


    directionLight = new Hilo3d.DirectionalLight({
        color: new Hilo3d.Color().fromHEX('#e15b26'),
        direction: new Hilo3d.Vector3(.5, -1, 0)
    }).addTo(window.game.stage);

    window.game.ambientLight = new Hilo3d.AmbientLight({
        color: new Hilo3d.Color(1, 1, 1),
        amount: .5
    }).addTo(window.game.stage);

    var ticker = window.game.ticker = new Hilo3d.Ticker(60);
    ticker.addTick(window.game.stage);
    ticker.addTick(Hilo3d.Tween);
    ticker.addTick(Hilo3d.Animation);
    window.game.stats = new Stats(ticker, window.game.stage.renderer.renderInfo);
    /*
    orbitControls = new OrbitControls(window.game.stage, {
        isLockMove: true,
        isLockZ: true
    });
    */

    ['init', 'initFailed'].forEach(function(eventName){
        window.game.renderer.on(eventName, function(e){
            console.log(e.type, e);
        });
    });

    setTimeout(function() {
        ticker.start(true);
        window.game.gl =  window.game.renderer.gl;
    }, 10);

    var utils = {
        keys: {},
        parseQuery(url) {
            var reg = /([^?#&=]+)=([^#&]*)/g;
            var params = {};
            var result;
            while ((result = reg.exec(url))) {
                params[result[1]] = decodeURIComponent(result[2]);
            }
            return params;
        },
        buildUrl(url, params) {
            if (url === undefined) {
                url = '';
            }

            if (params === undefined) {
                params = {};
            }
            
            var originParams = this.parseQuery(url);
            var newParams = Object.assign(originParams, params);
            var qs = Object.keys(newParams).map(function(key) {
                return key + '=' + encodeURIComponent(newParams[key])
            }).join('&');
            return url.replace(/(\?.*)?$/, '?' + qs);
        }
    };
}

utils.keys = utils.parseQuery(location.href);
module.exports = { 
    utils,
    camera: window.game.camera, 
    stage: window.game.stage, 
    renderer: window.game.renderer, 
    gl: window.game.gl, 
    ticker: window.game.ticker, 
    stats: window.game.stats,
    ambientLight: window.game.ambientLight,
    canvas: window.game.canvas }