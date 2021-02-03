import AbstractStageGame, { GameState } from './AbstractGame';
import Stage from './Stage';

import BulletGroup from '../Objects/BulletGroup';
import User from '../Objects/User';
import BrickGroup from '../Objects/BrickGroup';
import options from '../Options';

export default class Game extends AbstractStageGame {
  centerX: number;
  stageWidth: number;
  centerY: number;

  // stage
  stage: Stage;

  // object
  user: User;
  bullets: BulletGroup;
  bricks: BrickGroup;

  //view
  gameOverStr: string;
  gameOverSize: number;
  gameOverSizeChange: number;

  constructor() {
    super();

    this.gameOverSize = 10;
    this.gameOverSizeChange = 0.2;
    this.gameOverStr = 'PRESS START';

    const { stageWidth, stageHeight } = options.shape.stage;

    this.stageWidth = stageWidth;
    this.centerX = this.stageWidth / 2;
    this.centerY = stageHeight / 2;

    this.___eventHandler = this.___eventHandler.bind(this);
    window.addEventListener('click', this.___eventHandler);
  }

  ___eventHandler(): void {
    if (this.requestAnimationFrameId === 0) {
      return;
    } else if (this.gameState === 'ready') {
      this.gameState = 'prepareStage';
      this.gameOverStr = 'GAME OVER';
    }
  }

  onCreated(context: CanvasRenderingContext2D): void {
    super.onCreated(context);

    this.user = new User();
    this.bullets = new BulletGroup();
    this.bricks = new BrickGroup();

    this.stage = new Stage(this.user, this.bullets, this.bricks);
  }

  protected onInitialized(t: DOMHighResTimeStamp): GameState {
    //user 초기화
    this.user.setScore(0);
    this.user.setAbility(0, 0); // ballSize, bounce

    // bullets 초기화
    this.bullets.setSize(this.user.ballSize);
    this.bullets.setBounce(this.user.bounce);

    // brick 초기화
    this.bricks.clear();
    this.bricks.setSize(6, 5); // row, col
    this.bricks.setDurability(0);

    // stage 초기화
    this.stage.setStage(0, 0); // level, try

    return 'ready';
  }

  protected onReady(t: DOMHighResTimeStamp): GameState {
    this.gameOverSize += this.gameOverSizeChange;

    if (this.gameOverSize >= 18 || this.gameOverSize <= 10) {
      this.gameOverSizeChange *= -1;
    }

    return 'ready';
  }

  protected onPrepareStage(t: DOMHighResTimeStamp): GameState {
    //사용자 업데이트
    this.user.addAbility(10, 1); //ballSize, bounce
    // bullet 업데이트
    this.bullets.reload();
    //FIXME Observer로 user 구독
    this.bullets.setSize(this.user.ballSize);
    this.bullets.setBounce(this.user.bounce);
    //brick 업데이트
    this.bricks.setDurability(this.bricks.durability + 10);
    //stage 업데이트
    this.stage.setStage(
      this.stage.level + 1, // stageLevel
      this.stage.tryCount + 5, // tryCount
    );
    // 스테이지 실행 준비
    this.bricks.create();
    this.stage.onPrepared();

    return 'runStage';
  }

  protected onRunStage(t: DOMHighResTimeStamp): GameState {
    this.stage.runStage();

    if (this.stage.tryCount <= 0) {
      this.stage.onStop();
      return 'initialize';
    } else if (this.bricks.getAliveCount() === 0) {
      this.stage.onStop();
      return 'prepareStage';
    } else {
      return 'runStage';
    }
  }

  protected onUpdateView(t: DOMHighResTimeStamp): void {
    super.onUpdateView(t);

    this.stage.draw(this.context);
    this.user.draw(this.context);
    this.bricks.draw(this.context);
    this.bullets.draw(this.context);

    if (this.gameState === 'ready') {
      this.___drawPressStart(this.context);
    }
  }

  private ___drawPressStart(ctx: CanvasRenderingContext2D): void {
    const { stageColor } = options.shape.stage;
    const { retroFont } = options.theme.font;

    ctx.beginPath();
    ctx.font = retroFont(this.gameOverSize);
    ctx.fillStyle = stageColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.gameOverStr, this.centerX, this.centerY, this.stageWidth);
    ctx.closePath();
  }

  exit() {
    super.exit();
    window.removeEventListener('click', this.___eventHandler);
  }
}
