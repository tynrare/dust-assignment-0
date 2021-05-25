/**
 * @file resources_manager.js
 * @author tynrare
 * @version 1
 * @module Engine
 */

import { GLTFLoader, Mesh } from 'hilo3d';
import assert from 'assert'
import logger from './utils/logger-public'

const res = require('../../assets/configs/res_locations.json');

/**
 * Handles assets files and caches
 *
 * @example
 *
 * @property {object} locations files paths
 */
class ResourcesManager {
	
	locations = res;
	
	gltfLoader = new GLTFLoader();
	
	cache = {};

	/**
	 * Call it before any actions
	 *
	 *
	 * @param {object} [locations=this.locations] .
	 * @param {object} locations.meshes paths to meshes
	 * @returns {Promise<void>} loading promise
	 */
	preload(locations = this.locations) {
		this.locations = locations;

		return this.preloadMeshes(this.locations.meshes);
	}

	//==== Methods

	/**
	 * Same as getMash but creates clone
	 *
	 * @param {string} name cached mesh name
	 * @returns {Mesh} clone of cached mesh
	 */
	getMeshClone(name) {
		return this.getMesh(name).clone(false);
	}

	/**
	 * Finds previously preloaded model/scene and cretes clone
	 *
	 * @example
	 * AssetManager.instance
	 *              .preloadMesh('my_mesh', '/path/to/my/mesh')
	 *              .then(()=>{
	 *                AssetManager.instance.getMeshClone('my_mesh');
	 *               });
	 * @param {string} name cached mesh name
	 * @returns {Mesh} clone of cached mesh
	 */
	getMesh(name) {
		const meshes = this.cache.meshes;
		assert.ok(
			meshes && meshes[name],
			`No model ${name} found in cache. You have to preloadModel(name, src)`
		);

		return meshes[name];
	}

	/**
	 * Same as getScene but creates clone
	 *
	 * @param {string} name cached mesh name
	 * @returns {Mesh} clone of cached mesh
	 */
	getSceneClone(name) {
		return this.getScene(name).clone(false);
	}

	/**
	 * Finds previously preloaded model/scene and cretes clone
	 *
	 * @example
	 * AssetManager.instance
	 *              .preloadMesh('my_mesh', '/path/to/my/mesh')
	 *              .then(()=>{
	 *                AssetManager.instance.getMeshClone('my_mesh');
	 *               });
	 * @param {string} name cached mesh name
	 * @returns {Mesh} clone of cached mesh
	 */
	getScene(name) {
		const GLTFs = this.cache.GLTFs;
		assert.ok(
			GLTFs && GLTFs[name],
			`No model ${name} found in cache. You have to preloadModel(name, src)`
		);

		return GLTFs[name].node;
	}

	/**
	 * Preloads and saves models in memory.
	 * You can access them by
	 *
	 * @async
	 * @param {string} name name you can access model after
	 * @param {string} path file path
	 * @returns {Promise<void>} loading promise
	 */
	preloadMesh(name, path) {
		this.cache.GLTFs = this.cache.GLTFs || {};
		this.cache.meshes = this.cache.meshes || {};

		return new Promise((resolve, reject) => {
			this.gltfLoader
				.load({
					src: path
				})
				.then((model) => {
					logger.group('GAME_RES_OPERATION', `Node from ${path} preloaded as '${name}' scene`);
					this.cache.GLTFs[name] = model;

					for (const i in model.meshes) {
						const mesh = model.meshes[i];
						const meshname = mesh.parent.name;
						logger.group(
							'GAME_RES_OPERATION',
							`Mesh from scene '${name}' preloaded as '${meshname}' mesh`
						);
						this.cache.meshes[meshname] = mesh;
					}

					resolve();
				})
				.catch((reason) => {
					reject(reason);
				});
		});
	}

	/**
	 * @param {Thingy} meshes list of .gltf files to preload. Keys will be used as names. Path field as src
	 * @returns {Promise<void>} loading promise
	 */
	preloadMeshes(meshes) {
		return new Promise((resolve, reject) => {
			const promises = [];
			for (const k in meshes) {
				promises.push(this.preloadMesh(k, meshes[k]));
			}
			Promise.all(promises)
				.then(() => resolve())
				.catch((reason) => {
					reject(reason);
				});
		});
	}
}

export default ResourcesManager;
