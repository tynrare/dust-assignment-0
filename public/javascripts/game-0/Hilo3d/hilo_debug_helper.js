import HiloLineRender from './hilo_line_render.js';
import { Vector3, Node, Mesh, SphereGeometry, BasicMaterial, Color } from 'hilo3d';
import { cache, DEFAULT_GEOM_NORMALS_SIZE } from '../math';

/**
 * Assists with debug primitives
 */
class HiloDebugHelper {
	properties = {
		geometry: {},
		materials: {},
		lines: {},
	};

	hilo = null;

	/**
	 * .
	 */
	init() {
		this.hilo = new Node({ name: 'debug' });

		return this;
	}

	/**
	 * Removes node
	 */
	dispose() {
		this.clearLines();
		this.hilo.removeFromParent();
	}

	/**
	 * @param {Vector3} normal .
	 * @param {Vector3} pos .
	 * @param {string} color name
	 */
	drawNormal(normal, pos, color = '#FF0000') {
		var line = this.properties.lines[color] = this.properties.lines[color] ?? new HiloLineRender({ color });

		line.addLine(pos, cache.vec3.v0.copy(normal).scale(DEFAULT_GEOM_NORMALS_SIZE).add(pos));
	}

	/**
	 * @param {Vector3} a .
	 * @param {Vector3} b .
	 * @param {string} color name
	 */
	drawLine(a, b, color = '#FF0000') {
		var line = this.properties.lines[color] = this.properties.lines[color] ?? new HiloLineRender({ color });

		line.addLine(a, b);
	}

	/**
	 * @param {string} color name
	 */
	clearLine(color) {
		const line = this.properties.lines[color];
		if (line) {
			line.clear();
		}
	}

	/**
	 * .
	 */
	clearLines() {
		for (const color in this.properties.lines.cache) {
			this.clearLine(color);
		}
	}

	/**
	 * @param {number} [radius=1] radius scale
	 * @param {string} [color='attention'] .
	 * @returns {Mesh} .
	 */
	makeSphere(radius = 1, color = '#FF0000') {
		var geometry = 
			this.properties.geometry[radius] ?? 
			new SphereGeometry({
				radius: radius * DEFAULT_GEOM_NORMALS_SIZE,
				heightSegments: 4,
				widthSegments: 4
			});
		var material = 
			this.properties.materials[color] ?? 
			new BasicMaterial({
				lightType: 'NONE',
				diffuse: new Color().fromHEX(color)
			});

		const mesh = new Mesh({
			useInstanced: true,
			geometry,
			material
		});

		this.hilo.addChild(mesh);

		return mesh;
	}
}

export default HiloDebugHelper;
