(function() {
    var canvas = document.getElementById('canvas'),
            context = canvas.getContext('2d');

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight-300;

            /**
             * Your drawings need to be inside this function otherwise they will be reset when 
             * you resize the browser window and the canvas goes will be cleared.
             */
            drawStuff(); 
    }
    resizeCanvas();

    function drawStuff() {
            // do your drawing stuff here
    }
})();
var Simulation = {};

var distribution = [gaussian(0, 1), gaussian(0, 1), gaussian(0, 1)];

Simulation.initialize = function () {
    this.entities = [];
    this.v = [[], [], []]
    this.v1_vol = 60
    this.v1_drift = 30
    this.canvas = document.getElementById("canvas")
    this.ctx = this.canvas.getContext("2d");
    this.securityColor = ["#9A9932", "#EB4345", "#19699A"]
    this.fps = 40;
};
Simulation.draw = function () {
    this.x_scale = 2;
    this.y_offset = this.canvas.height/2.; 
    this.ctx.lineWidth = 2;
    this.ctx.lineCap='square'
    this.ctx.lineJoin = 'bevel'
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var j = 0; j < this.v.length; j++){
        this.ctx.beginPath();
        this.ctx.strokeStyle=this.securityColor[j];
        var vj = this.v[j]
        this.ctx.moveTo(0, this.y_offset)
        for (var i = 0; i < vj.length; i++) {
            this.ctx.lineTo(i*this.x_scale, (-vj[i] + this.y_offset));
        }
        this.ctx.stroke();
    }
};
Simulation.update = function () {
    // hard coding of three assets
    sigma = this.v1_vol
    sigma1 = sigma
    sigma2 = sigma * 1.4
    sigma3 = sigma
    mu = this.v1_drift
    dt = 0.002
    // random normal variable

    // make the random processes correlated
    // http://www.sitmo.com/article/generating-correlated-random-numbers/
    U = [
        [1, .6, .3],
        [0, .8, .4],
        [0,  0, .866],
    ]
    U = math.matrix([
        [1, .9, .4],
        [0, .4359, -0.1376],
        [0,  0, .9061],
    ])


    // a Weiner process
    c = 3

    e = [[]]
    for (var i=0; i<c; i++){
        e[0].push(distribution[i].ppf(Math.random()))
    }
    e_corr = math.multiply(e, U)
    for (var i=0; i<c; i++){
        dW = e_corr._data[0][i] * Math.sqrt(dt);

        // a generalized Wiener process has a drift term
        dX = mu * dt + sigma1 * dW
        // step
        if (this.v[i].length == 0){this.v[i] = [0]}
        X_t = this.v[i][this.v[i].length - 1] + dX
        this.v[i].push(X_t)

        // if this path goes past the end of the canvas restart the simulation
        if (this.v[i].length > this.canvas.width/this.x_scale) { this.v[i] = [0] }
    }
};
Simulation.initialize();

Simulation.run = (function () {
    var loops = 0, skipTicks = 1000 / Simulation.fps,
        maxFrameSkip = 10,
        nextSimulationTick = (new Date).getTime();

    return function () {
        loops = 0;

        while ((new Date).getTime() > nextSimulationTick) {
            Simulation.update();
            nextSimulationTick += skipTicks;
            loops++;
        }

        Simulation.draw();
    };
})();

(function () {
    var onEachFrame;
    onEachFrame = function (cb) {
        var _cb = function () { cb(); requestAnimationFrame(_cb); }
        _cb();
    };
    window.onEachFrame = onEachFrame;
})();

window.onEachFrame(Simulation.run);
