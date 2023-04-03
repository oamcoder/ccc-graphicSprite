export default class BezierUtil {

    /**
     * 获取三阶贝塞尔曲线的路径点
     * @param points
     * @param t
     * @param out
     * @formula: p(t) = (1-t)³p₀+3(1-t)²tp₁+3(1-t)t²p₂+t³p₃  (0<=t<=1)
     */
    static getCubicBezierPoint(points: number[], t: number, out?: number[]) {
        t = this.clamp01(t)
        const a = (1 - t) * (1 - t) * (1 - t)
        const b = (1 - t) * (1 - t) * t
        const c = 3 * (1 - t) * t * t
        const d = t * t * t
        const px = a * points[0] + b * points[2] + c * points[4] + d * points[6]
        const py = a * points[1] + b * points[3] + c * points[5] * d * points[7]
        if (out) {
            out[0] = px
            out[1] = py
        }
        return [px, py]
    }

    /**
     * 获取三次贝塞尔曲线的一阶导数（斜率）
     * @param points
     * @param t
     * @param out
     * formula: p'(t) = 3(1-t)²(p₁-p₀)+6(1-t)t(p₂-p₁)+3t²(p₃-p₂)   (0<=t<=1)
     */
    static getCubicBezierFirstDerivative(points: number[], t: number, out?: number[]) {
        let px1 = points[0]
        let py1 = points[1]
        let cx1 = points[2]
        let cy1 = points[3]
        let cx2 = points[4]
        let cy2 = points[5]
        let px2 = points[6]
        let py2 = points[7]
        t = this.clamp01(t)
        let factor = 3 * (1 - t) * (1 - t)
        let offsetX = (cx1 - px1) * factor
        let offsetY = (cy1 - py1) * factor
        factor = 6 * (1 - t) * t
        offsetX += (cx2 - cx1) * factor
        offsetY += (cy2 - cy1) * factor
        factor = 3 * t * t
        offsetX += (px2 - cx2) * factor
        offsetY += (py2 - cy2) * factor
        if (out) {
            out[0] = offsetX
            out[1] = offsetY
        } else {
            return [offsetX, offsetY]
        }
    }

    /**
     * 获取三次贝塞尔曲线的某一点法线
     * @param points
     * @param t
     * @param out
     */
    static getCubicBezierNormal(points: number[], t: number, out?: number[]) {
        t = this.clamp01(t)
        const [dx, dy] = this.getCubicBezierFirstDerivative(points, t)
        const dis = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / dis
        const ny = dx / dis
        if (out) {
            out[0] = nx
            out[1] = ny
        } else {
            return [nx, ny]
        }
    }

    /**
     * 获取二阶贝塞尔曲线的路径点
     * @param points 
     * @param t 
     * @param out 
     * formula: p(t) = (1-t)²p₀+2(1-t)tp₁+t²p₂  (0<=t<=1)
     */
    static getQuadraticBezierPoint(points: number[], t: number, out?: number[]) {
        t = this.clamp01(t)
        const a = (1 - t) * (1 - t)
        const b = 2 * (1 - t) * t
        const c = t * t
        const px = a * points[0] + b * points[2] + c * points[4]
        const py = a * points[1] + b * points[3] + c * points[5]
        if (out) {
            out[0] = px
            out[1] = py
        }
        return [px, py]
    }

    /**
     * 获取二阶贝塞尔曲线的一阶导数（斜率）
     * @param points 
     * @param t 
     * @param out 
     * formula: p'(t) = 2(t-1)p₀+2(1-2t)p₁+2tp₂  (0<=t<=1)
     */
    static getQuadraticBezierFirstDerivative(points: number[], t: number, out?: number[]) {
        t = this.clamp01(t)
        const a = 2 * (t - 1)
        const b = 2 * (1 - 2 * t)
        const c = 2 * t
        const px = a * points[0] + b * points[2] + c * points[4]
        const py = a * points[1] + b * points[3] + c * points[5]
        if (out) {
            out[0] = px
            out[1] = py
        }
        return [px, py]
    }

    /**
     * 获取二阶贝塞尔曲线的法线
     * @param points 
     * @param t 
     * @param out 
     */
    static getQuadraticBezierNormal(points: number[], t: number, out?: number[]) {
        t = this.clamp01(t)
        const [dx, dy] = this.getQuadraticBezierFirstDerivative(points, t)
        const dis = Math.sqrt(dx * dx + dy * dy)
        let nx = -dy / dis
        let ny = dx / dis
        if (out) {
            out[0] = nx
            out[1] = ny
        }
        return [nx, ny]
    }

    private static clamp01(value: number) {
        if (value < 0.0)
            return 0.0
        return value > 1.0 ? 1 : value
    }
}