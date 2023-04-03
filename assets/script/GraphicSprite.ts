const { ccclass, property, requireComponent } = cc._decorator

interface SpriteVerticesType {
    x: number[];
    y: number[];
    nu: number[];
    nv: number[];
    triangles: number[];
}

@ccclass
@requireComponent(cc.Sprite)
export default class GraphicSprite extends cc.Component {

    @property({
        displayName: '宽度'
    })
    protected spriteH: number = 30

    @property
    protected maxU: number = 0.9

    @property
    protected minU: number = 0.1

    protected sprite: cc.Sprite
    protected vertices: SpriteVerticesType = {
        x: [],
        y: [],
        nu: [],
        nv: [],
        triangles: []
    }
    protected readonly dir = cc.v2()
    protected readonly leftTop = cc.v2()
    protected readonly leftBottom = cc.v2()
    protected readonly rightTop = cc.v2()
    protected readonly rightBottom = cc.v2()
    protected readonly tempVec2 = cc.v2()

    protected onLoad() {
        this.sprite = this.getComponent(cc.Sprite)
        this.sprite.spriteFrame['vertices'] = this.vertices
    }

    protected addVertices(...item: cc.Vec2[]): void {
        item.forEach((p: cc.Vec2) => {
            this.vertices.x.push(p.x)
            this.vertices.y.push(p.y)
        })
    }

    protected getTriangleOffset() {
        return this.vertices.x.length
    }

    protected getU(length: number) {
        let u = length / this.node.width
        const integer = Math.floor(u)
        const decimals = Number(u.toFixed(3))
        u = decimals - integer
        if (u < this.minU) u = this.minU
        else if (u > this.maxU) u = this.maxU
        return u
    }

    stroke(path: cc.Vec2[], normals: cc.Vec2[]) {
        for (const key in this.vertices) {
            this.vertices[key].length = 0
        }

        if (path.length < 2)
            return
        let p0 = path[path.length - 1]
        let p1 = path[0]
        if (path.length > 2 && p0.equals(p1))
            return

        let lineLength = 0
        const w = this.spriteH / 2

        for (let i = 0; i < path.length - 1; i++) {
            const triangleOffset = this.getTriangleOffset()
            const p = path[i]
            const nextP = path[i + 1]
            nextP.sub(p, this.dir)
            const dirLen = this.dir.mag()
            const normalP = normals[i]
            const normalNextP = normals[i + 1]

            normalP.mul(w, this.tempVec2)
            p.add(this.tempVec2, this.leftTop)
            p.sub(this.tempVec2, this.leftBottom)
            normalNextP.mul(w, this.tempVec2)
            nextP.add(this.tempVec2, this.rightTop)
            nextP.sub(this.tempVec2, this.rightBottom)

            this.addVertices(this.leftBottom, this.leftTop, this.rightBottom, this.rightTop)
            this.vertices.nv.push(1, 0, 1, 0)

            let u = this.getU(lineLength)//lineLength / this.node.width
            this.vertices.nu.push(u, u)
            lineLength += dirLen
            u = this.getU(lineLength)//lineLength / this.node.width
            this.vertices.nu.push(u, u)
            this.vertices.triangles.push(triangleOffset + 0)
            this.vertices.triangles.push(triangleOffset + 1)
            this.vertices.triangles.push(triangleOffset + 2)
            this.vertices.triangles.push(triangleOffset + 1)
            this.vertices.triangles.push(triangleOffset + 2)
            this.vertices.triangles.push(triangleOffset + 3)
        }

        // console.log('查看数据', this.vertices)
        //TODO:此方法在数据量过大时会导致数组拷贝时间过长，考虑优化
        this.sprite['setVertsDirty']()
    }
}
