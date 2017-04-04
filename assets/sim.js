// keep the canvas at the same size as the page
(function() {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d');

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
    }
    resizeCanvas();
})();

var Simulation = {};

Simulation.initialize = function () {
    INITIAL_ASSET_COUNT = 4
    this.entities = [];
    this.canvas = document.getElementById("canvas")
    this.ctx = this.canvas.getContext("2d");
    this.securityColor = ["#BF3100", "#0B4FB2", "#E8E102", "#02C94C", "#A204C9"]
    this.fps = 60;
    this.n = INITIAL_ASSET_COUNT;
    this.initializeSimulation()
};

Simulation.initializeSimulation = function() {
    document.getElementById('asset_count').textContent = Simulation.n
    this.v = _.times(this.n, function(){return []});
    this.distribution = _.times(this.n, function(){return gaussian(0, 1)});
    A = math.matrix([
          [1,  .09, .06, .072, -0.2448],
          [.09,  1,    .029,  .066, .057],
          [.06, .029,      1, -0.003, .04],
          [.072, .066,     -0.003, 1, -0.02],
          [-0.2448, .057, .04, -0.02, 1]
    ])
    // cholesky decomposition, keep it in initiliaze so if we allow bumping corrs
    L = math.matrix().resize([A.size()[0], A.size()[1]], 0)
    for (var i=0; i < L.size()[0]; i++){
        for (var j=0; j < i+1; j++){
            s = 0
            for (var k = 0; k< j; k ++){
                s += L._data[i][k] * L._data[j][k]
            }
            if(i == j){
                L._data[i][j] = math.sqrt(A._data[i][i] - s)
            }
            else{
                L._data[i][j] = 1.0 / L._data[j][j] * (A._data[i][j] - s)
            }
        }
    }
    L = math.transpose(L)
    var sigma = 60;
    var sigma1 = sigma;
    var sigma2 = sigma * 1.4;
    var sigma3 = sigma;
    var v1_drift = 30
    var VOL = math.matrix([sigma1, sigma2, sigma3, sigma1, sigma2])
    var DRIFT = math.matrix([v1_drift, v1_drift, v1_drift, v1_drift, v1_drift])
    this.sigma = VOL.resize([this.n])
    this.mu = DRIFT.resize([this.n])
    this.corr = L.resize([this.n, this.n])
};

Simulation.update = function () {
    dt = 0.002;
    sigma = this.sigma;
    n = this.n;
    mu = this.mu;
    corr = this.corr;
    // a Weiner process
    // Generate some random numbers
    e = _.range(n).map(function(i){return Simulation.distribution[i].ppf(Math.random())})

    // make the random processes correlated
    // http://www.sitmo.com/article/generating-correlated-random-numbers/
    e_corr = math.multiply(e, corr)
    dW = math.multiply(e_corr, Math.sqrt(dt));

    // Create a generalized Wiener process has 
    // a drift term and a stochastic term
    drift = math.multiply(mu, dt)
    vol = math.dotMultiply(sigma, dW)
    dX = math.add(drift, vol)

    // step forwards in the simulation
    for (var i=0; i<n; i++){
        if (this.v[i].length == 0){this.v[i] = [0]}
        X_t = this.v[i][this.v[i].length - 1] + dX._data[i]
        this.v[i].push(X_t)

        // if this path goes past the end of the canvas restart the simulation
        if (this.v[i].length > this.canvas.width/this.x_scale) { this.v[i] = [0] }
    }
};

Simulation.draw = function () {
    this.x_scale = 2;
    this.y_offset = this.canvas.height/1.5; 
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
            this.ctx.lineTo(0.5+i*this.x_scale, (0.5-vj[i] + this.y_offset));
        }
        this.ctx.stroke();
    }
};
Simulation.run = function () {
    Simulation.update();
    Simulation.draw();
    /*
    x = function(d){
       return d
    }
    y = function(d){
        return d
    }
    var valueline = d3.line()
        .x(function(d) { return x(d); })
        .y(function(d) { return y(d); });

    d3.select('canvas')
        .append('svg')
        .append('g')
        .append("path").attr("d", valueline(Simulation.v[0]))
    */
};

Simulation.initialize();
d3.interval(Simulation.run, 1000/Simulation.fps)

document.getElementById('increase_asset_count').onclick = function(){
    Simulation.n=math.min(Simulation.n+1, 10);
    Simulation.initializeSimulation();
};
document.getElementById('decrease_asset_count').onclick = function(){
    Simulation.n=math.max(Simulation.n-1, 1);
    Simulation.initializeSimulation();
};

/*
$.ajax({
     url:"https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json",
     dataType: 'json', // Notice! JSONP <-- P (lowercase)
     success:function(json){
         hr = json['activities-heart-intraday']['dataset'][json['activities-heart-intraday']['dataset'].length-1]['value']
         console.log(hr)
     },
     error:function(){},
     beforeSend: function (xhr) {
        clientKey = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyM1FCWlkiLCJhdWQiOiIyMjdRVlIiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyaHIiLCJleHAiOjE1MDE2OTY5NTMsImlhdCI6MTQ3MDE2MTQyMH0.eNrQP1ylavOc8PHVIvivglrj7NvY39DrGmpAvUPVSH4'
        xhr.setRequestHeader('Authorization', clientKey);
     }
});
*/
