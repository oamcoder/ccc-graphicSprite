import GraphicSprite from './GraphicSprite'
import BezierUtil from './BezierUtil'

const { ccclass, property } = cc._decorator

@ccclass
export default class Draw extends cc.Component {

    @property({
        displayName: '拟合最短线段长度'
    })
    protected readonly minDis: number = 30

    @property({
        displayName: '曲线精度'
    })
    protected readonly precision: number = 50

    protected graphicSprite: GraphicSprite
    protected readonly path: cc.Vec2[] = []
	protected readonly curves: cc.Vec2[] = [];
	protected readonly normals: cc.Vec2[] = [];
    private readonly samplePath: cc.Vec2[] = [];
	private readonly ctrlPoint = cc.v2();
	private readonly lastPoint = cc.v2();
	private readonly convertTemp: number[] = [];
    private readonly tempVec2 = cc.v2();

    protected onLoad(): void {
        this.graphicSprite = this.node.parent.getComponentInChildren(GraphicSprite)
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    protected onDisable(): void {
        this.path.length = 0
        this.curves.length = 0
        this.normals.length = 0
        this.samplePath.length = 0
        this.convertTemp.length = 0
        this.pool.length = 0
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this)
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    }

    protected onTouchStart(evt: cc.Event.EventTouch) {
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.addPathPoint(evt.getLocation());
    }

    protected onTouchMove(evt: cc.Event.EventTouch) {
        this.addPathPoint(evt.getLocation());
        this.draw()
    }

    protected onTouchEnd(evt: cc.Event.EventTouch) {
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.addPathPoint(evt.getLocation());
        this.draw()
    }

    protected addPathPoint(point: cc.Vec2) {
		const v2 = this.getVec2();
		v2.set(point);
		this.path.push(v2);
	}

    protected draw() {
        this.putVec2()
		for (let i = 0; i < this.path.length; i++) {
			if (i == 0 || i == this.path.length - 1)
				this.samplePath.push(this.path[i]);
			for (let j = i + 1; j < this.path.length; j++) {
				if (j >= this.path.length - 1) break;
				const p = this.path[i];
				const nextP = this.path[j];
				if (cc.Vec2.distance(p, nextP) >= this.minDis) {
					this.samplePath.push(nextP);
					i = j;
				}
			}
		}

		const factor = 1 / this.precision;

		if (this.samplePath.length < 2) return;
		if (this.samplePath.length == 2) {
			this.curves.push(this.getVec2(this.samplePath[0]));
			this.curves.push(this.getVec2(this.samplePath[1]));
			this.samplePath[1].sub(this.samplePath[0], this.tempVec2);
			this.normals.push(this.getNormalVec(this.tempVec2));
			this.normals.push(this.getNormalVec(this.tempVec2));
		} else {
			for (let i = 0; i < this.samplePath.length;) {
				if (i == 0) this.lastPoint.set(this.samplePath[0]);
				const index = i == 0 ? i + 1 : i;
				const nextIndex = index + 1;
				if (!this.samplePath[nextIndex]) {
					this.curves.push(this.getVec2(this.samplePath[index]));
					this.samplePath[index].sub(this.lastPoint, this.tempVec2);
					this.normals.push(this.getNormalVec(this.tempVec2));
					break;
				}
				this.ctrlPoint.set(this.samplePath[index]);
				this.ctrlPoint.add(this.samplePath[nextIndex], this.tempVec2);
				this.tempVec2.mulSelf(0.5);
				let t = 0;
				this.convertTemp.length = 0;
				this.convertTemp.push(this.lastPoint.x, this.lastPoint.y, this.ctrlPoint.x, this.ctrlPoint.y, this.tempVec2.x, this.tempVec2.y);
				while (t <= 1) {
					const [x, y] = BezierUtil.getQuadraticBezierPoint(this.convertTemp, t);
					this.curves.push(this.getVec2(x, y));
					const [nx, ny] = BezierUtil.getQuadraticBezierNormal(this.convertTemp, t);
					this.normals.push(this.getVec2(nx, ny));
					t += factor;
				}
				this.lastPoint.set(this.tempVec2);
				if (i == 0) i += 2;
				else i++;
			}
		}
		this.curves.forEach((p, index) => {
			this.node.parent.convertToNodeSpaceAR(p, this.curves[index]);
		})
		this.graphicSprite.stroke(
			this.curves,
			this.normals
		);
    }

    private getNormalVec(vec: cc.Vec2) {
		const x = vec.x;
		const y = vec.y;
		vec.x = -y;
		vec.y = x;
		const v2 = this.getVec2();
		vec.normalize(v2);
		return v2;
    }

    private readonly pool: cc.Vec2[] = [];
    private getVec2(vec2: cc.Vec2)
	private getVec2(x?: number, y?: number)
	private getVec2(...args: any[]) {
		let v2 = this.pool.shift();
		if (!v2) v2 = cc.v2();
		if (args.length == 1 && args[0] instanceof cc.Vec2) {
			v2.set(args[0])
		} else {
			v2.x = args[0] ? args[0] : 0
			v2.y = args[1] ? args[1] : 0
		}
		return v2;
	}

    private putVec2() {
		this.samplePath.length = 0
		this.curves.forEach(p => {
			this.pool.push(p)
		})
		this.curves.length = 0
		this.normals.forEach(p => {
			this.pool.push(p)
		})
		this.normals.length = 0
	}
}