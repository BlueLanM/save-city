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

// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                 || ("ontouchstart" in window)
                 || (navigator.maxTouchPoints > 0);

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
const explosionCircle = null;
let gameOverText = null;
let savedLives = 0;
let currentScene = null; // 保存场景引用

// 移动端元素引用
let mobileInputArea = null;
let mobileInputField = null;
let sentenceDisplay = null;
let progressCount = null;
let progressTotal = null;
let progressFill = null;

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

	// 初始化移动端功能
	initMobileSupport();

	// 创建城市剪影
	createCityscape(this);

	// 显示开始指令 - 根据设备类型调整文本
	const instructionMsg = isMobile
		? "使用输入框输入\n下方的英文句子"
		: "使用键盘输入\n下方的英文句子";

	instructionText = this.add.text(300, 150, instructionMsg, {
		align: "center",
		fill: "#f5f5dc",
		fontFamily: "Arial, sans-serif",
		fontSize: "28px"
	}).setOrigin(0.5);

	// 显示第一个句子
	currentSentence = sentences[0];
	sentenceText = this.add.text(300, 550, currentSentence, {
		fill: "#f5f5dc",
		fontFamily: "Courier New",
		fontSize: "24px"
	}).setOrigin(0.5);

	// 监听键盘输入（仅在非移动端）
	if (!isMobile) {
		this.input.keyboard.on("keydown", handleKeyPress, this);
	}
}

function createCityscape(scene) {
	cityGraphics = scene.add.graphics();
	cityGraphics.lineStyle(2, 0xf5f5dc);
	cityGraphics.fillStyle(0xf5f5dc);

	// 地平线
	cityGraphics.strokeLineShape(new Phaser.Geom.Line(0, 450, 600, 450));

	// 建筑物数据 [x, y, width, height] - 填满整个屏幕底部
	const buildingData = [
		[0, 380, 45, 70], // 最左侧高楼
		[45, 420, 25, 30], // 小建筑
		[70, 400, 35, 50], // 中等建筑
		[105, 410, 30, 40], // 小建筑
		[135, 360, 50, 90], // 高楼
		[185, 390, 40, 60], // 中高建筑
		[225, 420, 25, 30], // 小建筑
		[250, 370, 55, 80], // 中央左侧高楼
		[305, 350, 60, 100], // 中央最高楼
		[365, 370, 50, 80], // 中央右侧高楼
		[415, 410, 30, 40], // 小建筑
		[445, 390, 40, 60], // 中高建筑
		[485, 360, 50, 90], // 高楼
		[535, 400, 35, 50], // 中等建筑
		[570, 420, 30, 30] // 最右侧小建筑
	];

	buildingData.forEach(data => {
		const [x, y, w, h] = data;
		cityGraphics.fillRect(x, y, w, h);

		// 添加窗户
		if (h > 40) {
			const windowRows = Math.floor(h / 20);
			const windowCols = Math.max(1, Math.floor(w / 20));
			for (let i = 0; i < windowRows; i++) {
				for (let j = 0; j < windowCols; j++) {
					cityGraphics.fillStyle(0xd98636);
					const windowX = x + 5 + j * (w / windowCols);
					const windowY = y + 10 + i * 15;
					cityGraphics.fillRect(windowX, windowY, 6, 6);
					cityGraphics.fillStyle(0xf5f5dc);
				}
			}
		}
	});
}

function createBomb(scene) {
	// 创建炸弹容器
	bomb = scene.add.container(300, 50);

	// 创建炸弹图形
	const bombGraphics = scene.add.graphics();

	// 炸弹阴影
	bombGraphics.fillStyle(0x000000, 0.3);
	bombGraphics.fillCircle(0, 30, 12);

	// 炸弹身体 - 深色金属
	bombGraphics.fillStyle(0x2a2a2a);
	bombGraphics.fillEllipse(0, 12, 18, 24);

	// 高光
	bombGraphics.fillStyle(0x505050);
	bombGraphics.fillEllipse(-4, 8, 6, 10);

	// 炸弹顶部
	bombGraphics.fillStyle(0x1a1a1a);
	bombGraphics.fillRect(-6, -8, 12, 8);

	// 引线
	bombGraphics.lineStyle(2, 0xf5f5dc);
	bombGraphics.beginPath();
	bombGraphics.moveTo(-3, -12);
	bombGraphics.lineTo(-5, -16);
	bombGraphics.strokePath();

	// 火花（引线燃烧）
	const spark = scene.add.graphics();
	spark.fillStyle(0xff6600);
	spark.fillCircle(-5, -16, 3);
	bomb.add(spark);

	// 火花闪烁动画
	scene.tweens.add({
		alpha: 0.3,
		duration: 300,
		repeat: -1,
		targets: spark,
		yoyo: true
	});

	// 将图形添加到容器
	bomb.add(bombGraphics);

	// 启用物理
	scene.physics.world.enable(bomb);
	bomb.body.setSize(20, 25);
	bomb.body.setOffset(-10, 0);
	bomb.body.setVelocity(0, 50); // 缓慢下落

	// 添加轻微摇晃效果
	scene.tweens.add({
		angle: -5,
		duration: 500,
		ease: "Sine.easeInOut",
		repeat: -1,
		targets: bomb,
		yoyo: true
	});
}

function handleKeyPress(event) {
	const key = event.key;

	// 游戏结束时，按 ENTER 重启游戏
	if (gameState === "gameOver") {
		if (key === "Enter") {
			restartGame(this);
		}
		return;
	}

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
	// 禁用中间输入显示
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
	// 每输入一个正确字符，发射字符攻击炸弹
	if (bomb && bomb.body) {
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

		// 记录炸弹的目标位置（动画开始时）
		const targetBombY = bomb.y + 20;

		// 字符飞向炸弹的动画 - 更华丽的效果
		scene.tweens.add({
			alpha: 0,
			duration: 500,
			ease: "Back.easeIn",
			onComplete: () => {
				flyingChar.destroy();

				// 只有在字符到达时才击退炸弹
				if (bomb && bomb.body) {
					bomb.y -= 20; // 向上推20个像素
				}

				// 击中炸弹时的小爆炸效果
				const impact = scene.add.graphics();
				impact.fillStyle(0xffff00, 0.8);
				impact.fillCircle(bomb.x, bomb.y + 20, 15);
				scene.tweens.add({
					alpha: 0,
					duration: 300,
					ease: "Power2",
					onComplete: () => impact.destroy(),
					onUpdate: () => {
						impact.clear();
						impact.fillStyle(0xffff00, impact.alpha);
						impact.fillCircle(bomb.x, bomb.y + 20, 15 + (1 - impact.alpha) * 20);
					},
					targets: impact
				});
			},
			onUpdate: () => {
				// 添加轨迹光晕效果
				const trail = scene.add.graphics();
				trail.fillStyle(0xf5f5dc, 0.3);
				trail.fillCircle(flyingChar.x, flyingChar.y, 8 * flyingChar.scale);
				scene.tweens.add({
					alpha: 0,
					duration: 300,
					onComplete: () => trail.destroy(),
					targets: trail
				});
			},
			scale: 1.8,
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

	// 获取炸弹位置
	const bombX = bomb ? bomb.x : 300;
	const bombY = bomb ? bomb.y : 380;

	// 停止炸弹
	if (bomb && bomb.body) {
		bomb.body.setVelocity(0, 0);
	}

	// 隐藏句子和输入
	sentenceText.setVisible(false);

	// 创建震动效果
	scene.cameras.main.shake(800, 0.02);

	// 创建多层爆炸效果
	createExplosionEffect(scene, bombX, bombY);

	// 创建房屋倒塌效果
	createBuildingCollapseEffect(scene);

	// 延迟隐藏炸弹，让爆炸效果先显示
	scene.time.delayedCall(200, () => {
		if (bomb) bomb.setVisible(false);
	});

	// 显示游戏结束文字（延迟显示）
	scene.time.delayedCall(1500, () => {
		gameOverText = scene.add.text(300, 60, `城市被毁了\n你拯救了 ${savedLives} 条生命`, {
			align: "center",
			fill: "#f5e6d3",
			fontFamily: "Arial, sans-serif",
			fontSize: "32px",
			shadow: {
				blur: 5,
				color: "#000",
				fill: true,
				offsetX: 2,
				offsetY: 2
			},
			stroke: "#8b4513",
			strokeThickness: 4
		}).setOrigin(0.5).setAlpha(0);

		// 文字淡入效果
		scene.tweens.add({
			alpha: 1,
			duration: 1000,
			ease: "Power2",
			targets: gameOverText
		});

		// 添加重启提示文字
		const restartText = scene.add.text(300, 500, "按 ENTER 键重新开始", {
			align: "center",
			fill: "#f5f5dc",
			fontFamily: "Arial, sans-serif",
			fontSize: "22px"
		}).setOrigin(0.5).setAlpha(0);

		// 提示文字淡入效果
		scene.tweens.add({
			alpha: 1,
			duration: 1000,
			ease: "Power2",
			targets: restartText
		});

		// 添加闪烁效果
		scene.tweens.add({
			alpha: 0.3,
			delay: 1000,
			duration: 800,
			repeat: -1,
			targets: restartText,
			yoyo: true
		});
	});
}

// 创建爆炸效果
function createExplosionEffect(scene, x, y) {
	// 第一层 - 核心闪光
	const flash = scene.add.graphics();
	flash.fillStyle(0xffffff, 1);
	flash.fillCircle(x, y, 20);

	scene.tweens.add({
		alpha: 0,
		duration: 200,
		onComplete: () => flash.destroy(),
		targets: flash
	});

	// 第二层 - 火球扩散（多层）
	const fireballColors = [0xff3300, 0xff6600, 0xff9900, 0xffcc00];
	fireballColors.forEach((color, index) => {
		const fireball = scene.add.graphics();
		fireball.fillStyle(color, 0.8 - index * 0.15);
		fireball.fillCircle(x, y, 10);

		scene.tweens.add({
			alpha: 0,
			duration: 600 + index * 100,
			ease: "Power2",
			onComplete: () => fireball.destroy(),
			onUpdate: () => {
				fireball.clear();
				fireball.fillStyle(color, fireball.alpha);
				const radius = 10 + (1 - fireball.alpha) * (150 + index * 30);
				fireball.fillCircle(x, y, radius);
			},
			targets: fireball
		});
	});

	// 爆炸波纹
	for (let i = 0; i < 3; i++) {
		scene.time.delayedCall(i * 150, () => {
			const wave = scene.add.graphics();
			wave.lineStyle(3, 0xffaa00, 1);
			wave.strokeCircle(x, y, 20);

			scene.tweens.add({
				alpha: 0,
				duration: 800,
				ease: "Power2",
				onComplete: () => wave.destroy(),
				onUpdate: () => {
					wave.clear();
					wave.lineStyle(3, 0xffaa00, wave.alpha);
					const radius = 20 + (1 - wave.alpha) * 200;
					wave.strokeCircle(x, y, radius);
				},
				targets: wave
			});
		});
	}

	// 粒子效果 - 碎片飞溅
	for (let i = 0; i < 30; i++) {
		const angle = (Math.PI * 2 * i) / 30;
		const speed = 100 + Math.random() * 150;
		const particle = scene.add.graphics();

		const particleColor = Math.random() > 0.5 ? 0xff6600 : 0xffaa00;
		particle.fillStyle(particleColor);
		particle.fillRect(0, 0, 3 + Math.random() * 4, 3 + Math.random() * 4);
		particle.setPosition(x, y);

		const targetX = x + Math.cos(angle) * speed;
		const targetY = y + Math.sin(angle) * speed + Math.random() * 50;

		scene.tweens.add({
			alpha: 0,
			angle: Math.random() * 360,
			duration: 800 + Math.random() * 400,
			ease: "Power2",
			onComplete: () => particle.destroy(),
			targets: particle,
			x: targetX,
			y: targetY
		});
	}

	// 烟雾效果
	for (let i = 0; i < 8; i++) {
		scene.time.delayedCall(i * 100, () => {
			const startX = x + (Math.random() - 0.5) * 40;
			const startY = y;
			const smoke = scene.add.graphics();
			smoke.fillStyle(0x666666, 0.4);
			smoke.fillCircle(0, 0, 20);
			smoke.setPosition(startX, startY);

			const targetY = startY - 100 - Math.random() * 50;

			scene.tweens.add({
				alpha: 0,
				duration: 1500 + Math.random() * 500,
				ease: "Power1",
				onComplete: () => smoke.destroy(),
				onUpdate: (tween) => {
					smoke.clear();
					smoke.fillStyle(0x666666, smoke.alpha * 0.4);
					const radius = 20 + (1 - smoke.alpha) * 30;
					smoke.fillCircle(0, 0, radius);
				},
				targets: smoke,
				y: targetY
			});
		});
	}
}

// 创建建筑物倒塌效果
function createBuildingCollapseEffect(scene) {
	// 隐藏原始城市图形
	scene.time.delayedCall(300, () => {
		if (cityGraphics) cityGraphics.setAlpha(0);
	});

	// 建筑物数据（与创建时相同）
	const buildingData = [
		[0, 380, 45, 70], // 最左侧高楼
		[45, 420, 25, 30], // 小建筑
		[70, 400, 35, 50], // 中等建筑
		[105, 410, 30, 40], // 小建筑
		[135, 360, 50, 90], // 高楼
		[185, 390, 40, 60], // 中高建筑
		[225, 420, 25, 30], // 小建筑
		[250, 370, 55, 80], // 中央左侧高楼
		[305, 350, 60, 100], // 中央最高楼
		[365, 370, 50, 80], // 中央右侧高楼
		[415, 410, 30, 40], // 小建筑
		[445, 390, 40, 60], // 中高建筑
		[485, 360, 50, 90], // 高楼
		[535, 400, 35, 50], // 中等建筑
		[570, 420, 30, 30] // 最右侧小建筑
	];

	// 让每个建筑物倒塌
	buildingData.forEach((data, index) => {
		const [bx, by, bw, bh] = data;

		// 延迟倒塌（从中心向外）
		const distanceFromCenter = Math.abs(bx - 300);
		const delay = 300 + (200 - distanceFromCenter) * 2;

		scene.time.delayedCall(delay, () => {
			// 创建建筑物碎片
			const pieces = 3 + Math.floor(Math.random() * 3);
			for (let i = 0; i < pieces; i++) {
				const pieceWidth = bw / pieces;
				const pieceHeight = bh * (0.3 + Math.random() * 0.4);
				const piece = scene.add.graphics();

				piece.fillStyle(0xf5f5dc, 0.8);
				piece.fillRect(0, 0, pieceWidth, pieceHeight);
				piece.setPosition(bx + i * pieceWidth, by + bh - pieceHeight);

				// 倒塌动画
				const fallDirection = (bx < 300 ? -1 : 1) * (0.5 + Math.random() * 0.5);
				scene.tweens.add({
					alpha: 0.3,
					angle: fallDirection * (30 + Math.random() * 60),
					duration: 600 + Math.random() * 400,
					ease: "Power2",
					onComplete: () => {
						// 碎片着地后变成废墟
						piece.destroy();
						const debris = scene.add.graphics();
						debris.fillStyle(0xf5f5dc, 0.5);
						debris.fillRect(piece.x - pieceWidth / 2, 445, pieceWidth * 1.5, 5);
					},
					targets: piece,
					x: piece.x + fallDirection * (20 + Math.random() * 30),
					y: 450 - Math.random() * 20
				});
			}

			// 添加尘埃效果
			for (let j = 0; j < 5; j++) {
				const dust = scene.add.graphics();
				dust.fillStyle(0xcccccc, 0.3);
				dust.fillCircle(bx + bw / 2, by + bh, 10);

				scene.tweens.add({
					alpha: 0,
					duration: 800 + Math.random() * 400,
					ease: "Power1",
					onComplete: () => dust.destroy(),
					onUpdate: () => {
						dust.clear();
						dust.fillStyle(0xcccccc, dust.alpha * 0.3);
						const radius = 10 + (1 - dust.alpha) * 15;
						dust.fillCircle(dust.x, dust.y, radius);
					},
					targets: dust,
					x: dust.x + (Math.random() - 0.5) * 30,
					y: dust.y - 30 - Math.random() * 20
				});
			}
		});
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

	// 淡出效果
	scene.cameras.main.fadeOut(500);

	scene.cameras.main.once("camerafadeoutcomplete", () => {
		// 重启场景
		scene.scene.restart();
		// 淡入效果
		scene.cameras.main.fadeIn(500);
	});
}

function update() {
	if (gameState === "playing" && bomb && bomb.body) {
		// 检查炸弹是否到达地面
		if (bomb.y >= 430) {
			gameOver(this);
		}
	}
}

// 初始化移动端支持
function initMobileSupport() {
	if (!isMobile) return;

	// 显示移动端控制提示
	const desktopHint = document.getElementById("control-hint-desktop");
	const mobileHint = document.getElementById("control-hint-mobile");
	if (desktopHint) desktopHint.style.display = "none";
	if (mobileHint) mobileHint.style.display = "inline-block";

	// 获取移动端元素
	mobileInputArea = document.getElementById("mobile-input-area");
	mobileInputField = document.getElementById("mobile-input");
	sentenceDisplay = document.getElementById("sentence-display");
	progressCount = document.getElementById("progress-count");
	progressTotal = document.getElementById("progress-total");
	progressFill = document.getElementById("progress-fill");

	// 显示移动端输入区域
	if (mobileInputArea) {
		mobileInputArea.style.display = "block";
	}

	// 更新句子显示和进度
	updateMobileDisplay();

	// 监听输入框变化
	if (mobileInputField) {
		let lastInputLength = 0;

		mobileInputField.addEventListener("input", (e) => {
			const currentValue = e.target.value.toLowerCase();
			const currentLength = currentValue.length;

			// 判断是输入还是删除
			if (currentLength > lastInputLength) {
				// 用户输入了新字符
				const newChar = currentValue[currentLength - 1];
				handleMobileInput(newChar);
				lastInputLength = mobileInputField.value.length; // 更新为实际长度
			} else if (currentLength < lastInputLength) {
				// 用户删除了字符 - 不允许删除
				e.target.value = userInput;
				lastInputLength = userInput.length;
			}
		});

		// 游戏结束时允许重启
		mobileInputField.addEventListener("keydown", (e) => {
			if (gameState === "gameOver" && e.key === "Enter") {
				restartGameMobile();
			}
		});

		// 自动聚焦输入框
		mobileInputField.focus();
	}
}

// 更新移动端显示
function updateMobileDisplay() {
	if (!isMobile) return;

	// 更新句子显示
	if (sentenceDisplay) {
		sentenceDisplay.textContent = currentSentence;
	}

	// 更新进度
	const cleanInput = userInput.replace(/\s/g, "");
	const cleanSentence = currentSentence.replace(/\s/g, "");
	const typed = cleanInput.length;
	const total = cleanSentence.length;
	const percentage = total > 0 ? (typed / total) * 100 : 0;

	if (progressCount) progressCount.textContent = typed;
	if (progressTotal) progressTotal.textContent = total;
	if (progressFill) progressFill.style.width = percentage + "%";
}

// 处理移动端输入
function handleMobileInput(char) {
	if (!currentScene) return;

	// 游戏结束时不处理输入
	if (gameState === "gameOver") return;

	// 检查当前字符是否正确（忽略空格）
	const cleanInput = userInput.replace(/\s/g, "");
	const cleanSentence = currentSentence.replace(/\s/g, "");

	// 获取下一个应该输入的字符
	const nextCharIndex = cleanInput.length;
	const expectedChar = cleanSentence[nextCharIndex];

	// 如果输入的是空格，跳过
	if (char === " ") {
		userInput += char;
		updateInputDisplay();
		return;
	}

	// 检查字符是否正确
	if (char === expectedChar) {
		// 正确的字符
		userInput += char;
		updateInputDisplay();
		updateMobileDisplay(); // 更新进度

		// 每输入一个正确字符就击退炸弹
		if (gameState === "start") {
			// 开始阶段不击退
		} else if (gameState === "playing") {
			pushBombUp(currentScene);
		}

		// 检查是否完成整个句子
		const newCleanInput = userInput.replace(/\s/g, "");
		if (newCleanInput === cleanSentence) {
			// 完成整个句子
			if (gameState === "start") {
				startGame(currentScene);
			} else if (gameState === "playing") {
				// 完成句子，更换新句子
				savedLives++;
				nextSentence();
			}
			userInput = "";
			updateInputDisplay();
			updateMobileDisplay(); // 更新为新句子

			// 清空输入框
			if (mobileInputField) {
				mobileInputField.value = "";
			}
		}
	} else {
		// 错误的字符 - 给予反馈
		if (mobileInputField) {
			// 添加抖动动画
			mobileInputField.classList.add("input-error");
			setTimeout(() => {
				mobileInputField.classList.remove("input-error");
			}, 300);

			// 错误颜色反馈
			mobileInputField.style.borderColor = "rgba(255, 50, 50, 0.8)";
			mobileInputField.style.background = "rgba(255, 200, 200, 0.9)";

			setTimeout(() => {
				mobileInputField.style.borderColor = "rgba(102, 126, 234, 0.6)";
				mobileInputField.style.background = "rgba(255, 255, 255, 0.95)";
			}, 300);

			// 移除错误的字符
			mobileInputField.value = userInput;
		}
	}
}

// 移动端重启游戏
function restartGameMobile() {
	if (currentScene) {
		restartGame(currentScene);

		// 清空输入框并重新聚焦
		if (mobileInputField) {
			mobileInputField.value = "";
			setTimeout(() => {
				mobileInputField.focus();
			}, 600);
		}

		// 更新句子显示
		if (sentenceDisplay) {
			setTimeout(() => {
				sentenceDisplay.textContent = currentSentence;
			}, 600);
		}
	}
}