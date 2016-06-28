(function() {
    var canvas = document.getElementById('canvas'),
            context = canvas.getContext('2d');

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = 300

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
    this.y_offset = this.canvas.height/2.; 
    this.x_scale = 2;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap='square'
    this.ctx.lineJoin = 'bevel'
    this.securityColor = ["#9A9932", "#EB4345", "#19699A"]
    this.fps = (this.canvas.width)/(8*this.x_scale);
};
Simulation.multiply = function(a, b){
    r = new Array(a.length)
    for (var i=0; i < a.length; i++){
        v = new Array()
        for (var j=0; j < b[0].length; j++){
            sum = 0;
            for (var k=0; k < a[0].length; k++){
                sum += a[i][k] * b[k][j]
            }
            v.push(sum)
        }
        r.push(v)
    }
    return r
    
}
Simulation.draw = function () {
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
    e1 = distribution[0].ppf(Math.random())
    e2 = distribution[1].ppf(Math.random())
    e3 = distribution[2].ppf(Math.random())
    e = [[e1, e2, e3]]

    // make the random processes correlated
    // http://www.sitmo.com/article/generating-correlated-random-numbers/
    U = [
        [1, .6, .3],
        [0, .8, .4],
        [0,  0, .866],
    ]
    U = [
        [1, .9, .4],
        [0, .4359, -0.1376],
        [0,  0, .9061],
    ]
    e_corr = this.multiply(e, U)
    // a Weiner process
    dW1 = e_corr[1][0] * Math.sqrt(dt);
    dW2 = e_corr[1][1] * Math.sqrt(dt);
    dW3 = e_corr[1][2] * Math.sqrt(dt);

    // a generalized Wiener process has a drift term
    dX1 = mu * dt + sigma1 * dW1
    dX2 = mu * dt + sigma2 * dW2
    dX3 = mu * dt + sigma3 * dW3

    // step
    if (this.v[0].length == 0){this.v[0] = [0]}
    if (this.v[1].length == 0){this.v[1] = [0]}
    if (this.v[2].length == 0){this.v[2] = [0]}
    X_t1 = this.v[0][this.v[0].length - 1] + dX1
    X_t2 = this.v[1][this.v[1].length - 1] + dX2
    X_t3 = this.v[2][this.v[2].length - 1] + dX3
    this.v[0].push(X_t1)
    this.v[1].push(X_t2)
    this.v[2].push(X_t3)

    // if this path goes past the end of the canvas restart the simulation
    if (this.v[0].length > this.canvas.width/this.x_scale) { this.v[0] = [0] }
    if (this.v[1].length > this.canvas.width/this.x_scale) { this.v[1] = [0] }
    if (this.v[2].length > this.canvas.width/this.x_scale) { this.v[2] = [0] }
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