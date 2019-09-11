
const timeInterval = 40 // frame 更新間隔

function Game() {
	this.timeStamp = 0
	this.dt = 0
	this.frames = 0
}

Game.prototype.timerLoop = function() {
	var ts = Date.now()
	this.dt += ts - this.timeStamp
	console.log(ts,'-',this.timeStamp,'=',this.dt)
	this.timeStamp = ts


	if (this.dt >= timeInterval) { // frame 更新
		this.frames ++
		this.dt -= timeInterval
		console.log('Frame Update :',this.frames)
	}

	setTimeout(()=>{this.timerLoop()}, 0) // 10 毫秒之後再跑一次 
}

Game.prototype.start = function() {
	console.log('Start.')
	this.timeStamp = Date.now()
	this.dt = 0
	this.frames = 0
	this.timerLoop()
}

var game = new Game()
game.start()