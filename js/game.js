/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-this-alias */

const config = {
	backgroundColor: "#e89f4f", // 更亮的橙色背景
	height: 600,
	parent: "game-container",
	physics: {
		arcade: {
			debug: false,
			gravity: { y: 0 } // 初始无重力
		},
		default: "arcade"
	},
	scene: {
		create,
		update
	},
	type: Phaser.AUTO,
	width: 600
};

const game = new Phaser.Game(config);

// 游戏状态
let gameState = "start"; // start, playing, gameOver
let currentSentence = "";
let userInput = "";
let bomb = null;
let sentenceText = null;
let instructionText = null;
let cityGraphics = null;
const buildings = [];
const inputDisplay = null;
let explosionCircle = null;
let gameOverText = null;
let savedLives = 0;
let currentScene = null; // 保存场景引用

// 句子库
const sentences = [
	"start",
	"great now keep typing",
	"you are doing well",
	"save the city from bombs",
	"keep typing to win",
	"almost there keep going",
	"you can do this",
	"protect the buildings",
	"nice job soldier",
	"the city needs you"
];

function create() {
	currentScene = this;

	// 创建城市剪影
	createCityscape(this);

	// 显示开始指令
	instructionText = this.add.text(300, 150, "use your keyboard\nto type the sentence below", {
		align: "center",
		fill: "#f5f5dc",
		fontFamily: "Courier New",
		fontSize: "28px"
	}).setOrigin(0.5);

	// 显示第一个句子
	currentSentence = sentences[0];
	sentenceText = this.add.text(300, 550, currentSentence, {
		fill: "#f5f5dc",
		fontFamily: "Courier New",
		fontSize: "24px"
	}).setOrigin(0.5);

	// 监听键盘输入
	this.input.keyboard.on("keydown", handleKeyPress, this);
}

function createCityscape(scene) {
	cityGraphics = scene.add.graphics();
	cityGraphics.lineStyle(2, 0xf5f5dc);
	cityGraphics.fillStyle(0xf5f5dc);

	// 地平线
	cityGraphics.strokeLineShape(new Phaser.Geom.Line(50, 450, 550, 450));

	// 建筑物数据 [x, y, width, height]
	const buildingData = [
		[60, 400, 40, 50],
		[115, 420, 15, 30],
		[140, 420, 15, 30],
		[165, 400, 30, 50],
		[205, 420, 15, 30],
		[230, 420, 15, 30],
		[260, 380, 40, 70],
		[310, 380, 40, 70],
		[360, 420, 15, 30],
		[385, 380, 50, 70],
		[445, 420, 15, 30]
	];

	buildingData.forEach(data => {
		const [x, y, w, h] = data;
		cityGraphics.fillRect(x, y, w, h);

		// 添加窗户
		if (h > 40) {
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 2; j++) {
					cityGraphics.fillStyle(0xd98636);
					cityGraphics.fillRect(x + 5 + j * 15, y + 10 + i * 15, 8, 8);
					cityGraphics.fillStyle(0xf5f5dc);
				}
			}
		}
	});
}

function createBomb(scene) {
	// 创建炸弹容器
	bomb = scene.add.container(250, 50);

	// 创建炸弹图形
	const bombGraphics = scene.add.graphics();
	bombGraphics.fillStyle(0xf5f5dc);

	// 炸弹身体
	bombGraphics.fillRect(-10, 0, 20, 25);

	// 炸弹顶部
	bombGraphics.fillRect(-6, -8, 12, 8);
	bombGraphics.fillRect(-3, -12, 6, 4);

	// 将图形添加到容器
	bomb.add(bombGraphics);

	// 启用物理
	scene.physics.world.enable(bomb);
	bomb.body.setSize(20, 25);
	bomb.body.setOffset(-10, 0);
	bomb.body.setVelocity(0, 50); // 缓慢下落
}

function handleKeyPress(event) {
	if (gameState === "gameOver") return;

	const key = event.key;

	// 只处理字母、数字和空格
	if (key.length === 1) {
		const inputChar = key.toLowerCase();

		// 检查当前字符是否正确（忽略空格）
		const cleanInput = userInput.replace(/\s/g, "");
		const cleanSentence = currentSentence.replace(/\s/g, "");

		// 获取下一个应该输入的字符
		const nextCharIndex = cleanInput.length;
		const expectedChar = cleanSentence[nextCharIndex];

		// 如果输入的是空格，检查是否应该跳过
		if (inputChar === " ") {
			userInput += inputChar;
			updateInputDisplay();
			return;
		}

		// 检查字符是否正确
		if (inputChar === expectedChar) {
			// 正确的字符
			userInput += inputChar;
			updateInputDisplay();

			// 每输入一个正确字符就击退炸弹
			if (gameState === "start") {
				// 开始阶段不击退，等全部输入完才开始
			} else if (gameState === "playing") {
				pushBombUp(this);
			}

			// 检查是否完成整个句子
			const newCleanInput = userInput.replace(/\s/g, "");
			if (newCleanInput === cleanSentence) {
				// 完成整个句子
				if (gameState === "start") {
					startGame(this);
				} else if (gameState === "playing") {
					// 完成句子，更换新句子
					savedLives++;
					nextSentence();
				}
				userInput = "";
				updateInputDisplay();
			}
		}
		// 如果字符不正确，不添加（或者可以选择添加但标记为错误）
	}
}

function updateInputDisplay() {
	// 已禁用中间输入显示
	// if (inputDisplay) {
	// 	inputDisplay.setText(userInput);
	// 	inputDisplay.setVisible(userInput.length > 0);
	// }

	// 更新底部句子显示，已输入的字符变透明
	updateSentenceDisplay();
}

function updateSentenceDisplay() {
	if (!sentenceText || !currentScene) return;

	// 计算已经输入了多少个字符（忽略空格）
	const cleanInput = userInput.replace(/\s/g, "");
	const typedCount = cleanInput.length;

	// 保存原始位置
	const sentenceX = sentenceText.x;
	const sentenceY = sentenceText.y;

	// 创建新的文本，只显示未输入的部分
	let remainingText = "";
	let charCount = 0;

	for (let i = 0; i < currentSentence.length; i++) {
		const char = currentSentence[i];

		if (char === " ") {
			remainingText += char;
		} else {
			if (charCount >= typedCount) {
				remainingText += char;
			} else {
				remainingText += " "; // 已输入的字符用空格代替
			}
			charCount++;
		}
	}

	// 销毁旧文本并创建新文本
	sentenceText.destroy();

	sentenceText = currentScene.add.text(sentenceX, sentenceY, remainingText, {
		fill: "#f5f5dc",
		fontFamily: "Courier New",
		fontSize: "24px"
	}).setOrigin(0.5);
}

function startGame(scene) {
	gameState = "playing";

	// 隐藏开始指令
	instructionText.setVisible(false);

	// 创建炸弹
	createBomb(scene);

	// 更换句子
	nextSentence();
}

function pushBombUp(scene) {
	// 每输入一个正确字符，炸弹向上推一点
	if (bomb && bomb.body) {
		// 向上推12个像素
		bomb.y -= 20;

		// 获取当前输入的字符（包含空格）
		const lastChar = userInput[userInput.length - 1];

		// 如果是空格，不显示飞行效果
		if (lastChar === " ") {
			return;
		}

		// 计算字符在句子中的位置（考虑空格）
		const charIndexInSentence = userInput.length - 1;

		// 计算句子文本的起始位置
		const sentenceWidth = sentenceText.width;
		const sentenceStartX = 300 - sentenceWidth / 2;

		// 估算字符的水平位置（简单的等宽字体计算）
		const charWidth = 14; // Courier New 24px 的大致字符宽度
		const charX = sentenceStartX + charIndexInSentence * charWidth;

		// 创建飞起的字符文本，从句子位置开始
		const flyingChar = scene.add.text(charX, 550, lastChar, {
			fill: "#f5f5dc",
			fontFamily: "Courier New",
			fontSize: "24px"
		}).setOrigin(0.5);

		// 字符飞向炸弹的动画 - 更缓和的效果
		scene.tweens.add({
			// 飞到炸弹附近
			alpha: 0.3,

			duration: 600,

			// 更长的动画时间，更缓和
			ease: "Cubic.easeOut",

			// 缓和的缓动效果
			onComplete: () => {
				flyingChar.destroy();
			},

			scale: 1.5,

			targets: flyingChar,

			x: bomb.x,
			y: bomb.y + 20
		});
	}
}

function repelBomb(scene) {
	savedLives++;

	// 炸弹向上飞
	bomb.body.setVelocity(0, -200);

	// 0.5秒后重新下落
	scene.time.delayedCall(500, () => {
		if (bomb && gameState === "playing") {
			bomb.y = 50;
			bomb.body.setVelocity(0, 50 + savedLives * 5); // 速度逐渐增加
		}
	});

	// 更换句子
	nextSentence();
}

function nextSentence() {
	// 随机选择一个句子
	const randomIndex = Math.floor(Math.random() * sentences.length);
	currentSentence = sentences[randomIndex];
	sentenceText.setText(currentSentence);
}

function gameOver(scene) {
	gameState = "gameOver";

	// 停止炸弹
	if (bomb && bomb.body) {
		bomb.body.setVelocity(0, 0);
		bomb.setVisible(false);
	}

	// 隐藏句子和输入
	sentenceText.setVisible(false);
	// inputDisplay.setVisible(false);

	// 创建爆炸效果（大圆圈）
	explosionCircle = scene.add.graphics();
	explosionCircle.fillStyle(0xf5e6d3, 0.9);
	explosionCircle.fillCircle(300, 380, 180);

	// 在爆炸圈内显示城市剪影（白色）
	const destroyedCity = scene.add.graphics();
	destroyedCity.fillStyle(0xf5f5dc, 0.6);

	// 绘制被摧毁的建筑物（简化版）
	const debrisData = [
		[100, 420, 30, 20],
		[150, 430, 25, 15],
		[190, 425, 20, 18],
		[230, 435, 15, 10],
		[260, 428, 22, 15],
		[300, 432, 18, 12],
		[340, 426, 25, 17],
		[380, 430, 20, 14],
		[420, 435, 15, 10],
		[460, 428, 22, 15]
	];

	debrisData.forEach(data => {
		const [x, y, w, h] = data;
		destroyedCity.fillRect(x, y, w, h);
	});

	// 显示游戏结束文字
	gameOverText = scene.add.text(300, 60, `the city is gone. you saved ${savedLives} lives`, {
		align: "center",
		fill: "#f5e6d3",
		fontFamily: "Courier New",
		fontSize: "24px"
	}).setOrigin(0.5);

	// 3秒后重启游戏
	scene.time.delayedCall(3000, () => {
		restartGame(scene);
	});
}

function restartGame(scene) {
	// 重置游戏状态
	gameState = "start";
	userInput = "";
	savedLives = 0;

	// 清理对象
	if (explosionCircle) explosionCircle.clear();
	if (gameOverText) gameOverText.destroy();

	// 重启场景
	scene.scene.restart();
}

function update() {
	if (gameState === "playing" && bomb && bomb.body) {
		// 检查炸弹是否到达地面
		if (bomb.y >= 430) {
			gameOver(this);
		}
	}
}