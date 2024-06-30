<script>
    import { T, useTask, useThrelte } from "@threlte/core";
    import { Gizmo, interactivity, OrbitControls } from "@threlte/extras";
    import * as THREE from "three";
    import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
    import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
    import CssObject from "./CssObject.svelte";
    import { onMount } from "svelte";
    import {
        Button,
        Checkbox,
        Element, Folder, List,
        Pane, Point, RadioGrid,
        RotationEuler, Separator,
        Slider, Text,
        ThemeUtils,
        Wheel
    } from "svelte-tweakpane-ui";
    import { getAllScenes, getScene, updateScene } from "$lib/db_test.js";
    import { easeOutExpo } from "$lib/utils.js";

    interactivity();

    export let sceneData;
    export let perf = true;

    let _sceneData;

    let initLoad = true;

    let transition_d = 0;
    let sourceVector = null;
    let destinationVector = null;
    let afterTransition = null;

    let lighting = Math.PI;
    let grid = true;
    let wireframe = false;
    let cameraOffset = 1;
    let sphereRadius = 100;
    let sphereSegmentsW = 48;
    let sphereSegmentsH = 48;
    let cameraRef = null;
    let cameraControlRef = null;

    let newType = "Popup";
    let newText = "";
    let newNextId = 1;
    let newAnimated = true;
    let newRounded = true;
    let allScene = {};

    let positions = [];
    let positionsPolar = [];
    let rotations = [];
    let optionsDisabled = true;

    let imgUrl = "";

    let rotateSpeed = -0.25;
    let texture = null;

    const { scene, size, autoRenderTask, camera } = useThrelte();
    const element2d = document.querySelector("#css-renderer-target-2d");
    const element3d = document.querySelector("#css-renderer-target-3d");
    const css2DRenderer = new CSS2DRenderer({ element: element2d });
    const css3DRenderer = new CSS3DRenderer({ element: element3d });
    $: css2DRenderer.setSize($size.width, $size.height);
    $: css3DRenderer.setSize($size.width, $size.height);
    scene.matrixWorldAutoUpdate = false;
    useTask((delta) => {
        const max = 1;
        if (transition_d > 0 && transition_d < max) {
            const dist = new THREE.Vector3().subVectors(destinationVector, sourceVector);
            if (dist.length() < 0.07) {
                transition_d = max;
            } else {
                transition_d += initLoad ? delta / 3 : delta;
                const ease = easeOutExpo(transition_d);
                camera.current.position.lerpVectors(sourceVector, destinationVector, ease);
                cameraControlRef.update();
            }
        } else if (transition_d >= max) {
            transition_d = 0;
            if (afterTransition) {
                afterTransition();
                afterTransition = null;
            }
        }
        scene.updateMatrixWorld();
    }, { before: autoRenderTask });
    useTask(() => {
        css2DRenderer.render(scene, camera.current);
        css3DRenderer.render(scene, camera.current);
    }, {
        after: autoRenderTask,
        autoInvalidate: false
    });

    onMount(() => {
        if (window.innerWidth < 768) {
            rotateSpeed = -0.7;
        }

        if (initLoad) {
            camera.current.position.set(0, 300, 0);
            cameraControlRef.update();
        } else {
            resetCamera();
        }

        document.addEventListener("wheel", (e) => {
            if (e.target.tagName === "CANVAS") {
                zoom(e.deltaY);
            }
        });
    });

    $: {
        if (cameraOffset && cameraRef !== null && !initLoad) {
            const curr = camera.current.position.clone();
            curr.normalize();
            curr.multiplyScalar(cameraOffset);
            camera.current.position.set(curr.x, curr.y, curr.z);
            cameraControlRef.update();
        }
    }

    $: if (sceneData) {
        processSceneData(sceneData);
    }

    $: if (positionsPolar.length > 0) {
        setPositions(positionsPolar);
    }

    const setPositions = (positionsPolar) => {
        positions = positionsPolar.map(polar => {
            const spherical = new THREE.Spherical(100, polar[1], polar[0]);
            const result =  new THREE.Vector3().setFromSpherical(spherical);
            return [result.x, result.y, result.z];
        });
    };

    const zoom = (delta) => {
        if (cameraRef !== null) {
            const min = 10;
            const max = 60;
            camera.current.fov += delta * 0.008;
            camera.current.fov = Math.max(min, Math.min(max, camera.current.fov));
            // TODO: scale speed with fov
            cameraRef.updateProjectionMatrix();
        }
    };

    const processSceneData = (data) => {
        if (data) {
            texture = null;
            disableControl();
            new THREE.TextureLoader().load(data.image, (t) => {
                texture = t;
                texture.colorSpace = THREE.SRGBColorSpace;
                positionsPolar = data.options.map(option => {
                    const spherical = new THREE.Spherical().setFromCartesianCoords(option.position[0], option.position[1], option.position[2]);
                    return [spherical.theta, spherical.phi];
                });
                rotations = data.options.map(option => option.rotation);
                _sceneData = sceneData;
                allScene = Object.fromEntries(getAllScenes().filter(scene => scene[0] !== _sceneData.id).map(scene => [`${scene[1]} (${scene[0]})`, scene[0]]));
                newNextId = allScene[Object.keys(allScene)[0]];

                if (initLoad) {
                    setTimeout(() => {
                        moveCamera(new THREE.Vector3(0, 0, 1), () => {
                            initLoad = false;
                            enableControl();
                        });
                    }, 1500);
                } else {
                    resetCamera();
                    enableControl();
                }
            });
        }
    };

    const moveCamera = (newPos, after) => {
        sourceVector = camera.current.position.clone();
        destinationVector = newPos;
        transition_d = 0.01;
        afterTransition = after;
    };

    const save = () => {
        sceneData.options = _sceneData.options.map((option, i) => {
            option.position = positions[i];
            option.rotation = rotations[i];
            return option;
        });
        updateScene(_sceneData.id, sceneData);
    };

    const resetCamera = () => {
        camera.current.position.set(0, 0, cameraOffset);
        cameraControlRef.update();
    };

    const disableControl = () => {
        optionsDisabled = true;
        if (cameraControlRef) cameraControlRef.enabled = false;
    };

    const enableControl = () => {
        optionsDisabled = false;
        if (cameraControlRef) cameraControlRef.enabled = true;
    };


</script>

<T.PerspectiveCamera
        makeDefault
        fov={60}
        near={1}
        far={1000}
        bind:ref={cameraRef}
>
    <OrbitControls enableDamping
                   rotateSpeed={rotateSpeed}
                   enablePan={false}
                   enableZoom={false}
                   enabled={false}
                   bind:ref={cameraControlRef}/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={lighting}/>

<Gizmo
        horizontalPlacement="left"
        paddingX={20}
        paddingY={20}
/>

<T.Mesh scale.x={-1}>
    <T.SphereGeometry args={[sphereRadius, sphereSegmentsW, sphereSegmentsH]}/>
    {#if texture}
        {#if wireframe}
            <T.MeshBasicMaterial color={0x000000} wireframe={true} side={THREE.BackSide}/>
        {:else}
            <T.MeshStandardMaterial map={texture} side={THREE.BackSide} toneMapped={false}/>
        {/if}
    {/if}
</T.Mesh>


{#if texture && _sceneData}
    {#if grid}
        <T.PolarGridHelper args={[20, 16, 20, 16]}/>
    {/if}

    {#if !optionsDisabled}
        {#each _sceneData.options as option, i (i)}
            {#if option.type === "popup"}
                <CssObject position={positions[i]}
                           center={[0, 0]}
                           rotation={rotations[i]}
                           pointerEvents={true}
                >
                    <div class="bg-surface text-white -translate-x-1/2 {option.rounded ? `rounded-full` : ``} {option.animated ? `animate-pulse-btn` : ``}">
                        <button class="p-2 overflow-hidden" on:click={() =>{
                            const newVector = new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]);
                            newVector.normalize();
                            newVector.negate();

                            moveCamera(newVector, () => {
                                alert("button clicked");
                            });
                        }} on:wheel={(e) => {
                            zoom(e.deltaY);
                        }}>
                            {option.text}
                        </button>
                    </div>
                </CssObject>
            {:else if option.type === "navigation"}
                <CssObject position={positions[i]}
                           center={[0, 0, 0]}
                           rotation={rotations[i]}
                           pointerEvents={true}
                           threeD={true}
                >
                    <div class="bg-transparent text-white {option.animated ? `animate-bounce` : ``}">
                        <button class="p-2" on:click={() => {
                            const newVector = new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]);
                            newVector.normalize();
                            newVector.negate();
                            newVector.y = 0;

                            moveCamera(newVector, () => {
                                sceneData = getScene(option.nextSceneId);
                            });
                        }} on:wheel={(e) => {
                            zoom(e.deltaY);
                        }}>
                            <i class="fa fa-chevron-down fa-lg"></i>
                        </button>
                    </div>
                </CssObject>
            {/if}
        {/each}
    {/if}

    <Pane
            theme={ThemeUtils.presets.light}
            position="fixed"
            title="test"
            width={270}
    >
        <Checkbox bind:value={perf} label="Performance"/>
        <Wheel label="Camera offset" step={1} bind:value={cameraOffset}/>
        <Wheel label="Segments W" min={0} max={120} step={1} bind:value={sphereSegmentsW}/>
        <Wheel label="Segments H" min={0} max={120} step={1} bind:value={sphereSegmentsH}/>
        <Slider label="Lighting" min={0} max={10} step={0.1} bind:value={lighting}/>
        <Checkbox bind:value={grid} label="Grid"/>
        <Checkbox bind:value={wireframe} label="Wireframe"/>
        {#each _sceneData.options as option, i (`${i}_${option.text}`)}
            <Folder title={_sceneData.options[i].text} expanded={false}>
                {#if _sceneData.options[i].type === "navigation"}
                    <RotationEuler bind:value={rotations[i]}
                                   expanded={false}
                                   label="Rotation"
                                   picker={'inline'}
                    />
                {/if}
                <Point bind:value={positionsPolar[i]}
                       expanded={true}
                       label="Position"
                       picker="inline"
                       min={-Math.PI}
                       max={Math.PI}
                       step={0.01}
                       userExpandable={true}
                />
                <Button title="Delete" on:click={() => {
                    _sceneData.options = _sceneData.options.filter((_, j) => j !== i);
                    positions = positions.filter((_, j) => j !== i);
                    rotations = rotations.filter((_, j) => j !== i);
                }}/>
            </Folder>
        {/each}
        <Folder title="Add option" expanded={false}>
            <RadioGrid bind:value={newType} values={["Popup", "Navigation"]}/>
            {#if newType === "Popup"}
                <Text label="Name" bind:value={newText}/>
                <Checkbox label="Rounded" bind:value={newRounded}/>
                <Checkbox label="Animated" bind:value={newAnimated}/>
            {:else if newType === "Navigation"}
                <Text label="Name" bind:value={newText}/>
                <List label="Next scene" bind:value={newNextId} options={allScene}/>
                <Checkbox label="Animated" bind:value={newAnimated}/>
            {/if}
            <Button title="Add" on:click={() => {
                if (newText === "") return;
                if (newType === "Popup") {
                    _sceneData.options = [..._sceneData.options, {
                        type: "popup",
                        text: newText,
                        rounded: newRounded,
                        animated: newAnimated,
                        position: [0, 0, 0],
                        rotation: [0, 0, 0],
                        popupText: ""
                    }];
                    positions.push([0, 0, 0]);
                    rotations.push([0, 0, 0]);
                } else if (newType === "Navigation") {
                    _sceneData.options = [..._sceneData.options, {
                        type: "navigation",
                        text: newText,
                        nextSceneId: newNextId,
                        animated: newAnimated,
                        position: [0, 0, 0],
                        rotation: [0, 0, 0]
                    }];
                    positions.push([0, 0, 0]);
                    rotations.push([0, 0, 0]);
                }
            }}/>
        </Folder>
        <Folder title="Add scene" expanded={false}>
            <Text value="Not implemented" disabled/>
        </Folder>
        <Folder title="Change image" expanded={false}>
            <Element>
                <input class="my-1" type="file" accept="image/*" on:change={e => {
                    const reader = new FileReader();
                    reader.addEventListener('load', function ( event ) {
                        new THREE.TextureLoader().load(event.target.result.toString(), (t) => {
                            texture = t;
                            texture.colorSpace = THREE.SRGBColorSpace;
                        });
                    });
                    reader.readAsDataURL(e.target.files[0]);
                }}/>
            </Element>
            <Separator/>
            <Text label="From url: " bind:value={imgUrl}/>
            <Button title="Load" on:click={() => {
                new THREE.TextureLoader().load(imgUrl, (t) => {
                    texture = t;
                    texture.colorSpace = THREE.SRGBColorSpace;
                });
            }}/>
        </Folder>
        <Button title="Save" on:click={save}/>
    </Pane>
{/if}