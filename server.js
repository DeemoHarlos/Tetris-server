const express = require('express')
const bodyParser = require('body-parser')
const log = require('./log')
const argv = require('minimist')(process.argv.slice(2))

var WebSocket = require('ws')
var port = 2407

const minoTypes = [
	{
		'type'  : 'I',
		'color' : 0x00FFFF,
		'shape' : [[-1, 0],[ 0, 0],[ 1, 0],[ 2, 0]],
		'center': [0.5,-0.5],
		'kick'  : [
			[[[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],[[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]]],
			[[[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],[[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]]],
			[[[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],[[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]]],
			[[[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],[[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]]]
		]
	},{
		'type'  : 'O',
		'color' : 0xFFFF00,
		'shape' : [[ 0, 1],[ 1, 1],[ 0, 0],[ 1, 0]],
		'center': [0.5,0.5],
		'kick'  : [[[],[]],[[],[]],[[],[]],[[],[]]]
	},{
		'type'  : 'T',
		'color' : 0xFF00FF,
		'shape' : [[ 0, 1],[-1, 0],[ 0, 0],[ 1, 0]],
		'center': [0,0],
		'kick'  : [
			[[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]]],
			[[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]]],
			[[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]]],
			[[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]]]
		]
	},{
		'type'  : 'S',
		'color' : 0x00FF00,
		'shape' : [[ 1, 1],[ 0, 1],[ 0, 0],[-1, 0]],
		'center': [0,0],
		'kick'  : [
			[[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]]],
			[[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]]],
			[[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]]],
			[[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]]]
		]
	},{
		'type'  : 'Z',
		'color' : 0xFF0000,
		'shape' : [[-1, 1],[ 0, 1],[ 0, 0],[ 1, 0]],
		'center': [0,0],
		'kick'  : [
			[[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]]],
			[[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]]],
			[[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]]],
			[[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]]]
		]
	},{
		'type'  : 'J',
		'color' : 0x0000FF,
		'shape' : [[-1, 1],[-1, 0],[ 0, 0],[ 1, 0]],
		'center': [0,0],
		'kick'  : [
			[[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]]],
			[[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]]],
			[[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]]],
			[[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]]]
		]
	},{
		'type'  : 'L',
		'color' : 0xFF8800,
		'shape' : [[-1, 0],[ 0, 0],[ 1, 0],[ 1, 1]],
		'center': [0,0],
		'kick'  : [
			[[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]]],
			[[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],[[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]]],
			[[[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],[[-1, 0],[-1, 1],[ 0,-2],[-1,-2]]],
			[[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],[[-1, 0],[-1,-1],[ 0, 2],[-1, 2]]]
		]
	}
]

function randomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function rotateMatrix(r) {
	if (r == 0)
		return [[1,0],[0,1]]
	else if (r == 1)
		return [[0,1],[-1,0]]
	else if (r == 2)
		return [[-1,0],[0,-1]]
	else if (r == 3)
		return [[0,-1],[1,0]]
}

function shuffle(arr) {
	var i,j,temp
	for (i=arr.length-1;i>0;i--) {
		j = Math.floor(Math.random()*(i+1))
		temp = arr[i]
		arr[i] = arr[j]
		arr[j] = temp
	}
	return arr
}

function idle() {
}

function Game(ws) {
	this.ws              = ws
	this.state           = 0
	this.stateFunction   = idle
	this.action          = idle
	this.actionTimeout   = 1000
	this.actionTimer     = 0
	this.frames          = 0
	this.dt              = 0
	this.timeStamp       = Date.now()

	this.playfield = []
	this.operationQueue = []
	this.minoSeq = [2,3,1,5,0,4,6]
	this.nextMino = []
	for (var i=0;i<5;i++) this.addNextMino()
	this.curMino = {'type':-1,'pos':[0,0]}
	this.ghostMino = {'type':-1,'pos':[0,0]}
	this.shiftMino = {'type':-1,'pos':[0,0]}
	this.shifted = false

	for(var i=0;i<23;i++) {
		var arr = []
		for(var j=0;j<10;j++) arr.push(-1)
		this.playfield.push(arr)
	}

	//keysetup?
}

Game.prototype.timerLoop = function() {
	var timeInterval = 40
	var ts = Date.now()
	this.dt += ts - this.timeStamp
	this.timeStamp = Date.now()
	if (this.dt >= timeInterval) {
		this.frames ++
		this.stateFunction(this.dt)
		this.sendData('none',[0x00,0x00,0x00,0x00])
		this.dt -= timeInterval
	}
	if(this.state == 1) setTimeout(()=>{this.timerLoop()}, 5)
}

Game.prototype.start = function() {
	console.log('start')
	this.timeStamp = Date.now()
	this.stateFunction = this.run
	this.action = this.fall
	this.state = 1
	this.dt = 0
	this.newMino()
	this.timerLoop()
}

Game.prototype.run = function(ms) {

	if (this.operationQueue.length > 0) {
		this.operationQueue.forEach((e,i,a)=>{e()})
		this.operationQueue = []
	}

	this.actionTimer -= ms
	if (this.actionTimer <= 0) {
		this.action()
		this.actionTimer = this.actionTimeout
	}
}

Game.prototype.fall = function() {
	var t = this.curMino.pos[1]
	this.curMino.pos[1] --
	if (this.collision(this.curMino)) {
		this.curMino.pos[1] = t
		this.lock()
	}
}

Game.prototype.lock = function() {
	// send data?
	var curMinoInfo = minoTypes[this.curMino.type]
	curMinoInfo.shape.forEach((e,i,a)=>{
		var blockPos = this.getBlockPos(e,this.curMino.pos,curMinoInfo.center,this.curMino.rotate)
		var x = blockPos[0]
		var y = blockPos[1]
		this.playfield[y][x] = this.curMino.type
	})
	this.checkFull()
	this.shifted = false
	this.newMino()
	this.actionTimer = 0
}

Game.prototype.checkFull = function() {
	var full = []
	this.playfield.forEach((e,i,a)=>{
		var flag = true
		for (b of e) {
			if (b==-1) {
				flag = false
				break
			}
		}
		if (flag) full.splice(0,0,i)
	})
	for (i of full) {
		this.playfield.splice(i,1)
		var arr = []
		for(var j=0;j<10;j++) arr.push(-1)
		this.playfield.push(arr)
	}
	// send data?
}

Game.prototype.newMino = function() {
	this.curMino = this.nextMino[0]
	this.curMino.pos = [4,19]
	this.curMino.rotate = 0
	if (this.collision(this.curMino)) this.curMino.pos = [4,20]
	//send data?

	this.nextMino.splice(0,1)
	this.nextMino.forEach((e,i,a)=>{
		e.pos=[13,18-3*i]
	})
	this.addNextMino()
	if (this.minoSeq.length<=0) this.minoSeq = shuffle([0,1,2,3,4,5,6])
	if (this.collision(this.curMino)) this.lose()
	else this.newGhostMino()
}

Game.prototype.addNextMino = function() {
	var i = this.nextMino.length
	this.nextMino.push({
		'type':this.minoSeq[0],
		'pos' :[13,18-3*i],
		'rotate':0,
	})
	//send data
	this.minoSeq.splice(0,1)
}

Game.prototype.getBlockPos = function(shift,pos,center,rotate) {
	var m = rotateMatrix(rotate)
	var newShift = [(shift[0]-center[0])*m[0][0]+(shift[1]-center[1])*m[0][1],
	                (shift[0]-center[0])*m[1][0]+(shift[1]-center[1])*m[1][1]]
	return [newShift[0]+pos[0]+center[0],newShift[1]+pos[1]+center[1]]
}

Game.prototype.setGhostPos = function() {
	this.ghostMino.pos = [this.curMino.pos[0],this.curMino.pos[1]]
	this.ghostMino.rotate = this.curMino.rotate
	var t = this.ghostMino.pos[1]
	while (!this.collision(this.ghostMino)) {
		t = this.ghostMino.pos[1]
		this.ghostMino.pos[1] --
	}
	this.ghostMino.pos[1] = t
}

Game.prototype.sendData = function(act,data) {
	if (this.state != 1) return

	var code
	switch (act) {
		case 'start'     : code = 0x01;break
	//	case 'pause'     : code = 0x02;break
		case 'lose'      : code = 0x08;break
		case 'fall'      : code = 0x10;break
		case 'softDrop'  : code = 0x20;break
		case 'hardDrop'  : code = 0x21;break
		case 'moveLeft'  : code = 0x22;break
		case 'moveRight' : code = 0x23;break
		case 'rotateCw'  : code = 0x24;break
		case 'rotateCcw' : code = 0x25;break
		case 'newMino'   : code = 0x30;break
		case 'hold'      : code = 0x31;break
		case 'lock'      : code = 0x32;break
		case 'none'      : code = 0x00;break
		default          : code = 0x00
	}

	var nl = this.nextMino.length
	var buf = Buffer.alloc(5+5+4+230+1+nl)

	var index = 0
	buf.writeUInt8(code,index++)
	buf.writeInt8(data[0],index++)
	buf.writeInt8(data[1],index++)
	buf.writeInt8(data[2],index++)
	buf.writeInt8(data[3],index++)

	buf.writeInt8(this.curMino.type,index++)
	buf.writeInt8(this.curMino.pos[0],index++)
	buf.writeInt8(this.curMino.pos[1],index++)
	buf.writeInt8(this.curMino.rotate,index++)
	buf.writeInt8(this.shiftMino.type,index++)

	buf.writeInt8(this.ghostMino.type,index++)
	buf.writeInt8(this.ghostMino.pos[0],index++)
	buf.writeInt8(this.ghostMino.pos[1],index++)
	buf.writeInt8(this.ghostMino.rotate,index++)

	this.playfield.forEach((y,yi,pf)=>{
		y.forEach((x,xi,y)=>{
			buf.writeInt8(x,index++)
		})
	})

	buf.writeInt8(nl,index++)
	this.nextMino.forEach((e,i,a)=>{buf.writeInt8(e.type,index++)})
	
	this.ws.send(buf)
}

Game.prototype.lock = function() {
	var curMinoInfo = minoTypes[this.curMino.type]
	curMinoInfo.shape.forEach((e,i,a)=>{
		var blockPos = this.getBlockPos(e,this.curMino.pos,curMinoInfo.center,this.curMino.rotate)
		var x = blockPos[0]
		var y = blockPos[1]
		this.playfield[y][x] = this.curMino.type
	})
	this.sendData('lock',[0x00,0x00,0x00,0x00])
	this.checkFull()
	this.shifted = false
	this.newMino()
	this.actionTimer = 0
}

Game.prototype.shift = function() {
	if (!this.shifted) {
		var tempMino = this.shiftMino
		this.shifted = true
		this.shiftMino = this.curMino
		this.shiftMino.pos = [-5,18]
		this.sendData('hold',[0x00,0x00,0x00,0x00])
		if (tempMino.type == -1) this.newMino()
		else {
			this.curMino = tempMino
			this.curMino.pos = [4,19]
			this.curMino.rotate = 0
			if (this.collision(this.curMino)) this.curMino.pos = [4,20]
			this.sendData('none',[0x00,0x00,0x00,0x00])
			if (this.collision(this.curMino)) this.lose()
			else this.newGhostMino()
		}
	}
}

Game.prototype.newGhostMino = function() {
	this.ghostMino.type = this.curMino.type
	this.ghostMino.pos = [this.curMino.pos[0],this.curMino.pos[1]]
	this.ghostMino.rotate = this.curMino.rotate
	this.setGhostPos()
}

Game.prototype.moveLeft = function() {
	var t = this.curMino.pos[0]
	this.curMino.pos[0] --
	if (this.collision(this.curMino)) this.curMino.pos[0] = t
	this.setGhostPos()
}

Game.prototype.moveRight = function() {
	var t = this.curMino.pos[0]
	this.curMino.pos[0] ++
	if (this.collision(this.curMino)) this.curMino.pos[0] = t
	this.setGhostPos()
}

Game.prototype.kick = function(type,x,ct) {
	var curMinoInfo = minoTypes[type]
	var u = this.curMino.pos
	for (e of curMinoInfo.kick[x][ct>0?0:1]) {
		this.curMino.pos = [u[0]+e[0],u[1]+e[1]]
		if (!this.collision(this.curMino)) return true
	}
	this.curMino.pos = u
	return false
}

Game.prototype.rotate = function(ct) { // TO FIX
	var t = this.curMino.rotate
	var u = this.curMino.pos
	this.curMino.rotate = (this.curMino.rotate+4+ct)%4
	if (this.collision(this.curMino)) {
		if (!this.kick(this.curMino.type,t,ct)) this.curMino.rotate = t
	}
	this.setGhostPos()
}

Game.prototype.rotateCw = function(ct) {
	this.rotate(1)
}

Game.prototype.rotateCcw = function(ct) {
	this.rotate(-1)
}

Game.prototype.softDrop = function() {
	var t = this.curMino.pos[1]
	this.curMino.pos[1] --
	if (this.collision(this.curMino)) this.curMino.pos[1] = t
	else this.actionTimer = this.actionTimeout
}

Game.prototype.hardDrop = function() {
	var t
	while (!this.collision(this.curMino)) {
		t = this.curMino.pos[1]
		this.curMino.pos[1] --
	}
	this.curMino.pos[1] = t
	this.lock ()
}

Game.prototype.collision = function(cur) {
	if (cur.type < 0) console.log("No mino to be checked")
	var curMinoInfo = minoTypes[cur.type]
	var flag = false
	curMinoInfo.shape.forEach((e,i,a)=>{
		var blockPos = this.getBlockPos(e,cur.pos,curMinoInfo.center,cur.rotate)
		var x = blockPos[0]
		var y = blockPos[1]
		if (x<0||y<0||y>22||x>9) {
			flag = true
			return
		}
		if (this.playfield[y][x] != -1) {
			flag = true
			return
		}
	})
	return flag
}

Game.prototype.lose = function() {
	console.log('lose')
	this.stateFunction = idle
}

const ws = new WebSocket.Server({port: port})

ws.on('connection', ws=>{
	var game = new Game(ws)
	ws.on('message', msg=>{
		var buf = Buffer.from(msg)
		console.log(buf)
		var code = buf.readUInt8(0)
		switch (code) {
			case 0x01 : game.start()    ;break
		//	case 0x02 : game.pause    ;break
			case 0x20 : game.operationQueue.push(()=>{game.softDrop() });break
			case 0x21 : game.operationQueue.push(()=>{game.hardDrop() });break
			case 0x22 : game.operationQueue.push(()=>{game.moveLeft() });break
			case 0x23 : game.operationQueue.push(()=>{game.moveRight()});break
			case 0x24 : game.operationQueue.push(()=>{game.rotateCw() });break
			case 0x25 : game.operationQueue.push(()=>{game.rotateCcw()});break
			case 0x31 : game.operationQueue.push(()=>{game.shift()     });break
		}
	})
	ws.on('close',()=>{
		game.state = 8
		game.lose()
		game = null
	})
})
/*
app.listen(port, ()=>{
	log.printLog('info','Listening on port ' + (port+'').cyan)
})
*/