/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable indent */

const config = {
	backgroundColor: "#0a0e27", // 深蓝色背景，更柔和
	height: 600,
	physics: {
		arcade: {
			debug: false,
			gravity: { x: 0 } // 重力
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