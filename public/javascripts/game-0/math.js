/* eslint-disable camelcase, complexity, max-params, no-magic-numbers, max-statements */
var { Matrix4, Node, Quaternion, Vector2, Vector3 } = require('hilo3d');

export const cache = {
	vec3: {
		v0: new Vector3(),
		v1: new Vector3(),
		v2: new Vector3(),
		v3: new Vector3(),
		v4: new Vector3(),
		v5: new Vector3(),
		v6: new Vector3(),
		v7: new Vector3(),
		v8: new Vector3(),
		v9: new Vector3()
	}
};

// buffer vectors
const vec0 = cache.vec3.v0;
const vec1 = cache.vec3.v1;
const vec2 = cache.vec3.v2;
const vec3 = cache.vec3.v3;
const vec4 = cache.vec3.v4;
const vecR = cache.vec3.v5; // functions return this vector

/**
 * @constant
 */
export const PERFECT_NUMBER = Math.sin(Math.PI / Math.pow(2, 2)); // 0.707
/**
 * PERFECT_NUMBER^2 * 0.1
 *
 * @constant
 */
export const DEFAULT_GEOM_THRESHOLD = Math.pow(PERFECT_NUMBER, 2) * 0.1; // 0.049
/**
 * DEFAULT_GEOM_THRESHOLD^2
 *
 * @constant
 */
export const PRECISE_GEOM_THRESHOLD = Math.pow(DEFAULT_GEOM_THRESHOLD, 2); // 0.00249
/**
 * DEFAULT_GEOM_THRESHOLD^5
 *
 * @constant
 */
export const ZERO_THRESHOLD = Math.pow(DEFAULT_GEOM_THRESHOLD, 5); // e-7
/**
 * DEFAULT_GEOM_THRESHOLD
 *
 * @constant
 */
export const LOOSE_GEOM_THRESHOLD = PERFECT_NUMBER * 0.1;
/**
 * Use it for any meta-purpused data such debug normals and mesh/grids scales
 * DEFAULT_GEOM_THRESHOLD * PERFECT_NUMBER
 *
 * @constant
 */
export const DEFAULT_GEOM_NORMALS_SIZE = DEFAULT_GEOM_THRESHOLD * PERFECT_NUMBER;

/**
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Maths/math.vector.ts#L1585
 *
 * @param {Vector3} axis local axis
 * @param {Matrix4} matrix world matrix
 * @returns {Vector3} world axis
 */
export function getDirection(axis, matrix) {
	const mat = matrix.elements;

	const v = new Vector3();

	return v.set(
		axis.x * mat[0] + axis.y * mat[4] + axis.z * mat[8],
		axis.x * mat[1] + axis.y * mat[5] + axis.z * mat[9],
		axis.x * mat[2] + axis.y * mat[6] + axis.z * mat[10]
	);
}

/**
 * @param {Vector3} normal .
 * @param {Node} node .
 */
export function alignToNormal(normal, node) {
	const nx = getDirection(new Vector3(0, 0, 1), node.worldMatrix);
	const nz = getDirection(new Vector3(-1, 0, 0), node.worldMatrix);
	node.quaternion.rotateX(normal.dot(nx));
	node.quaternion.rotateZ(normal.dot(nz));
}

/**
 * @param {Vector3} origin point distance to
 * @param {Array<Vector3>} points array of vectors to sort
 */
export function sortByDistance(origin, points) {
	points.sort((a, b) => {
		return origin.squaredDistance(a) - origin.squaredDistance(b);
	});
}

/**
 * @param {Vector2} a1 line 1 start
 * @param {Vector2} a2 line 1 end
 * @param {Vector2} b1 line 2 start
 * @param {Vector2} b2 line 2 end
 * @returns {number} cross
 */
export function crossProduct2Vector(a1, a2, b1, b2) {
	return (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
}

/**
 * Converts world coords into pos on plane
 *
 * @param {Vector3} point point to work with
 * @param {Vector3} origin plane origin
 * @param {Vector3} normal plane normal
 * @returns {Vector2} pos on plane
 */
export function posOnPlane(point, origin, normal) {
	const axis = new Vector3(0, 1, 0);
	const dist = point.clone().sub(origin);
	const v = new Vector3();
	const u = new Vector3();

	const dot = normal.dot(axis);
	if (dot === 0 || Math.abs(dot) === 1) {
		v.set(0, 0, 1);
		u.set(1, 0, 0);
	} else {
		v.copy(axis).cross(normal).normalize();
		u.copy(v).cross(normal).normalize();
	}

	const x = dist.dot(u);
	const y = dist.dot(v);

	return new Vector2(x, y);
}

/**
 * Returns pos on plane as 3d coordinate
 *
 * @param {Vector2} pos pos on plane
 * @param {Vector3} origin plane origin
 * @param {Vector3} normal plane normal
 * @returns {Vector3} 3d space coordinate
 */
export function pos2dto3d(pos, origin, normal) {
	const axis = new Vector3(0, 1, 0);
	const v = new Vector3();
	const u = new Vector3();

	const dot = normal.dot(axis);
	if (dot === 0 || Math.abs(dot) === 1) {
		v.set(0, 0, 1);
		u.set(1, 0, 0);
	} else {
		v.copy(axis).cross(normal).normalize();
		u.copy(v).cross(normal).normalize();
	}

	return u.scale(pos.x).add(v.scale(pos.y)).add(origin);
}

/**
 * "rotates" normal to another normal "plane"
 *
 * @param {Vector3} normal normal to shift
 * @param {Vector3} axis axis to shift around
 *
 * @returns {Vector3} aligned normal
 */
export function alignNormal(normal, axis) {
	const dot = axis.dot(normal);

	return vecR.copy(normal).sub(vec0.copy(axis).scale(dot));
}

/**
 * Converts world coords into pos on plane
 *
 * @param {Vector3} point point to work with
 * @param {Vector3} origin plane origin
 * @param {Vector3} normal plane normal
 * @returns {Vector3} point on plane
 */
export function projectOnPlane(point, origin, normal) {
	const local = vec3.copy(point).sub(origin);
	const forward = vec1.copy(normal).cross(local).normalize();
	const right = vec2.copy(normal).cross(forward).normalize();

	const x = local.dot(right);
	const z = local.dot(forward);

	return vecR.copy(origin).add(right.scale(x)).add(forward.scale(z));
}

/**
 * Closest point on segment
 *
 * @param {Vector3} a line start
 * @param {Vector3} b line end
 * @param {Vector3} point point to project
 * @returns {Vector3} closest to line point
 */
export function projectOnLine(a, b, point) {
	const local = vec0.copy(point).sub(a);
	const line = vecR.copy(b).sub(a).normalize();
	const dist = local.dot(line);

	return line.scale(dist).add(a);
}

/**
 * Project one segment on another. It isn't "crossing"
 * Uses vec0-3
 *
 * @param {Vector3} a1 line 1 start
 * @param {Vector3} b1 line 1 end
 * @param {Vector3} a2 line 2 start
 * @param {Vector3} b2 line 2 end
 * @returns {Vector3?} a1->b1 projection on a2->b2. Null if projection out of a2->b2 segment
 */
export function projectLineOnLine(a1, b1, a2, b2) {
	const y = vec1.copy(projectOnLine(a1, b1, a2));
	const z = vec2.copy(projectOnLine(a1, b1, b2));

	const yDist = a2.distance(y);
	const zDist = b2.distance(z);

	const proportion = yDist / (yDist + zDist);
	const yz = z.sub(y).scale(proportion || 0);

	const p = vecR.copy(y).add(yz);

	if (!isPointOnLineThresholded(a2, b2, p)) {
		return null;
	}

	return p;
}

/**
 * Closest point on segment. Thresholds a-b segment for validation
 *
 * @param {Vector3} a line start
 * @param {Vector3} b line end
 * @param {Vector3} point point to project
 * @returns {boolean} .
 */
export function isPointOnLine(a, b, point) {
	const n = vec1.copy(b).sub(a).normalize();

	return isPointInPlanePositive(a, n, point) && isPointInPlanePositive(b, n.negate(), point);
}

/**
 * Closest point on segment. Thresholds a-b segment for validation
 *
 * @param {Vector3} a line start
 * @param {Vector3} b line end
 * @param {Vector3} point point to project
 * @returns {boolean} .
 */
export function isPointOnLineThresholded(a, b, point) {
	const n = vec3.copy(b).sub(a).normalize();

	return (
		isPointInPlanePositiveThresholded(a, n, point) &&
		isPointInPlanePositiveThresholded(b, n.negate(), point)
	);
}

/**
 * @param {Vector3} origin plane origin
 * @param {Vector3} normal plane normal direction
 * @param {Vector3} point point to check
 * @returns {boolean} .
 */
export function isPointInPlanePositive(origin, normal, point) {
	const po = vec0.copy(point).sub(origin);

	return po.dot(normal) >= 0;
}

/**
 * @param {Vector3} origin plane origin
 * @param {Vector3} normal plane normal direction
 * @param {Vector3} point point to check
 * @returns {boolean} .
 */
export function isPointInPlanePositiveThresholded(origin, normal, point) {
	const threshold = vec1.copy(normal).scale(DEFAULT_GEOM_THRESHOLD);
	const o = vec2.copy(origin).sub(threshold);

	return isPointInPlanePositive(o, normal, point);
}

/**
 * Finds closest to X point on segment AX that lays on triangle ABC. (A shared
 * for segment and triagnle)
 * #interface 1
 * Uses vec0-4
 *
 * @param {Vector3} up up triangle direction
 * @param {Vector3} a a point for triangle and normal origin
 * @param {Vector3} b b triangle point
 * @param {Vector3} c c triangle point
 * @param {Vector3} normal normal from a in bc direction
 *
 * @returns {Vector3} point on BC. null if it isn't on BC
 */
export function findCevianForTriangle(up, a, b, c, normal) {
	const h = vec1.copy(projectOnLine(b, c, a)).sub(a);
	const forward = h.normalize();

	if (forward.dot(normal) <= 0) {
		return null;
	}

	const right = vec3.copy(forward).cross(up);
	const abdot = vec1.copy(b).sub(a).normalize().dot(right);
	const acdot = vec2.copy(c).sub(a).normalize().dot(right);

	const leftdot = Math.min(abdot, acdot);
	const rightdot = Math.max(abdot, acdot);
	const normaldot = normal.dot(right);

	const threshold = ZERO_THRESHOLD;
	if (normaldot >= leftdot - threshold && normaldot <= rightdot + threshold) {
		return projectLineOnLine(a, vec4.copy(a).add(normal), b, c);
	}

	return null;
}

/**
 * #interface -1
 *
 * @param {Vector2} a1 line 1 start
 * @param {Vector2} a2 line 1 end
 * @param {Vector2} b1 line 2 start
 * @param {Vector2} b2 line 2 end
 * @returns {object?} {at:number, bt:number} a and b intersection point
 *     percentage
 */
export function getIntersectPointValues(a1, a2, b1, b2) {
	if (a1.equals(a2) || b1.equals(b2)) {
		return null;
	}

	const denom = crossProduct2Vector(a1, a2, b1, b2);

	if (denom === 0) {
		// Lines parallel or overlap
		return null;
	}

	const at = crossProduct2Vector(b1, b2, b1, a1) / denom;
	const bt = crossProduct2Vector(a1, a2, b1, a1) / denom;

	return { at, bt };
}

/**
 * @param {Vector2} a1 line 1 start
 * @param {Vector2} a2 line 1 end
 * @param {Vector2} b1 line 2 start
 * @param {Vector2} b2 line 2 end
 * @returns {Vector2?} intersection point
 */
export function getIntersectPoint(a1, a2, b1, b2) {
	const intersect = getIntersectPointValues(a1, a2, b1, b2);
	if (!intersect) {
		return null;
	}

	if (!intersect || intersect.at < 0 || intersect.at > 1 || intersect.bt < 0 || intersect.bt > 1) {
		return null;
	}

	return getPositionOnSegment(a1, a2, intersect.at);
}

/**
 * #interface -1
 *
 * @param {Vector2} a start segment point
 * @param {Vector2} b end segment point
 * @param {number} t percentage (0-1) on segmment
 * @returns {Vector2} position on segment
 */
export function getPositionOnSegment(a, b, t) {
	const x = a.x + t * (b.x - a.x);
	const y = a.y + t * (b.y - a.y);

	return new Vector2(x, y);
}

/**
 * @param {Vector3} a .
 * @param {Vector3} b .
 * @param {Vector3} c .
 * @returns {Vector3} normalized triangle face vec
 */
export function triangleNormal(a, b, c) {
	const v0 = vec0.copy(a).sub(b); //                V0 = P0-P1
	const v1 = vecR.copy(c).sub(b); //                V1 = P2-P1
	const normal = v1.cross(v0).normalize(); // N = cross (V1, V0)

	return normal;
}

/**
 * @param {Vector3} a .
 * @param {Vector3} b .
 * @param {Vector3} c .
 * @returns {number} triangle area
 */
export function triangleArea(a, b, c) {
	const ab = vec0.copy(b).sub(a);
	const ac = vec1.copy(c).sub(a);

	// Не знаю почему 8. Подставил под значение для площади квадрата 1х1

	// 8 = 2^3
	// 1. Первая сперень - Параллограм пополам
	// 2. Вторая степень - Единицы измерения площади (m^2, например) (наверное)
	return vec2.copy(ab).cross(ac).len() / 8;
}

/**
 * Divides vec on val. Changes vec inplace
 * #nonpure
 *
 * @param {Vector3} vec vec to divide
 * @param {number} val .
 * @returns {Vector3} same vector
 */
export function divideVec3(vec, val) {
	vec.elements[0] /= val;
	vec.elements[1] /= val;
	vec.elements[2] /= val;

	return vec;
}

/**
 * Returns vectors middle position
 *
 * @param {Vector3} a .
 * @param {Vector3} b .
 * @param {Vector3} c .
 * @returns {Vector3} .
 */
export function posCenter(a, b, c) {
	return divideVec3(vecR.copy(a).add(b).add(c), 3);
}

/**
 * @param {number} val input value
 * @param {number} min minumum clamp value
 * @param {number} max maximum clamp value
 * @returns {number} [min, max]
 */
export function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val));
}

/**
 */
 export function map(value, inmin, inmax, outmin, outmax) {
	const clamped = clamp(value, inmin, inmax);
	let a = (clamped - inmin) / inmax;
	let b = (outmax - outmin) * a + outmin;

	return b;
}

/**
 * @param {number} a initial value
 * @param {number} b target value
 * @param {number} t factor
 * @returns {number} .
 */
export function lerp(a, b, t) {
	return a + t * (b - a);
}

export function intersectRayOnPlane(planeP, planeN, rayP, rayD)
{
    var d = planeP.dot(planeP, -planeN);
    var t = -(d + rayP.z * planeN.z + rayP.y * planeN.y + rayP.x * planeN.x) / (rayD.z * planeN.z + rayD.y * planeN.y + rayD.x * planeN.x);
    
	return rayP.add(rayD.scale(t));
}

/**
 * uses 0-4 buffer vectors
 *
 * @param {Vector3} a triangle point
 * @param {Vector3} b triangle point
 * @param {Vector3} c triangle point
 * @param {Vector3} origin ray origin
 * @param {Vector3} direction ray direction
 * @returns {Vector3?} intersection point
 */
export function intersectsTriangle(a, b, c, origin, direction) {
	const edge1 = vec0.copy(b).sub(a);
	const edge2 = vec1.copy(c).sub(a);
	const pvec = vec2.copy(direction).cross(edge2);
	const det = edge1.dot(pvec);

	if (det < ZERO_THRESHOLD) {
		return null;
	}
	const tvec = vec3.copy(origin).sub(a);
	const u = tvec.dot(pvec);
	if (u < 0 || u > det) {
		return null;
	}
	const qvec = vec4.copy(tvec).cross(edge1);
	const v = direction.dot(qvec);
	if (v < 0 || u + v > det) {
		return null;
	}

	const t = edge2.dot(qvec) / det;

	return vecR.set(
		origin.x + t * direction.x,
		origin.y + t * direction.y,
		origin.z + t * direction.z
	);
}

/**
 * @param {Matrix4} matrix matrix to ger data from
 * @param {Quaternion} result result to write into
 *
 * @returns {Quaternion} result
 */
export function fromRotationMatrix(matrix, result) {
	const data = matrix.elements;
	const m11 = data[0],
		m12 = data[4],
		m13 = data[8];
	const m21 = data[1],
		m22 = data[5],
		m23 = data[9];
	const m31 = data[2],
		m32 = data[6],
		m33 = data[10];
	const trace = m11 + m22 + m33;
	let s;
	if (trace > 0) {
		s = 0.5 / Math.sqrt(trace + 1.0);
		result.w = 0.25 / s;
		result.x = (m32 - m23) * s;
		result.y = (m13 - m31) * s;
		result.z = (m21 - m12) * s;
	} else if (m11 > m22 && m11 > m33) {
		s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
		result.w = (m32 - m23) / s;
		result.x = 0.25 * s;
		result.y = (m12 + m21) / s;
		result.z = (m13 + m31) / s;
	} else if (m22 > m33) {
		s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
		result.w = (m13 - m31) / s;
		result.x = (m12 + m21) / s;
		result.y = 0.25 * s;
		result.z = (m23 + m32) / s;
	} else {
		s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
		result.w = (m21 - m12) / s;
		result.x = (m13 + m31) / s;
		result.y = (m23 + m32) / s;
		result.z = 0.25 * s;
	}

	return result;
}
