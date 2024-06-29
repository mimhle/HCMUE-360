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

    interactivity();

    export let sceneData;
    export let perf = true;

    let _sceneData;

    let lighting = Math.PI;
    let grid = true;
    let cameraPosX = 1;
    let cameraPosY = 0;
    let cameraPosZ = 0;
    let cameraFov = 60;
    let sphereRadius = 100;
    let sphereSegmentsW = 48;
    let sphereSegmentsH = 48;
    let cameraRef = null;

    let newType = "Popup";
    let newText = "";
    let newNextId = 1;
    let newAnimated = true;
    let newRounded = true;
    let allScene = {};

    let positions = [];
    let rotations = [];

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
    useTask(() => {
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
    });

    const processSceneData = (data) => {
        if (data) {
            texture = null;
            new THREE.TextureLoader().load(data.image, (t) => {
                texture = t;
                texture.colorSpace = THREE.SRGBColorSpace;
                positions = data.options.map(option => option.position);
                rotations = data.options.map(option => option.rotation);
                _sceneData = sceneData;
                allScene = Object.fromEntries(getAllScenes().filter(scene => scene[0] !== _sceneData.id).map(scene => [`${scene[1]} (${scene[0]})`, scene[0]]));
                newNextId = allScene[Object.keys(allScene)[0]];
            });
        }
    };

    const save = () => {
        sceneData.options = _sceneData.options.map((option, i) => {
            option.position = positions[i];
            option.rotation = rotations[i];
            return option;
        });
        updateScene(_sceneData.id, sceneData);
    };

    $: if (sceneData) {
        processSceneData(sceneData);
    }


</script>

<T.PerspectiveCamera
        makeDefault
        position={[cameraPosX, cameraPosY, cameraPosZ]}
        fov={cameraFov}
        near={1}
        far={1000}
        bind:ref={cameraRef}
>
    <OrbitControls enableDamping rotateSpeed={rotateSpeed} enablePan={false} enableZoom={false}/>
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
        <T.MeshStandardMaterial map={texture} side={THREE.BackSide} toneMapped={false}/>
    {/if}
</T.Mesh>


{#if texture && _sceneData}
    {#if grid}
        <T.PolarGridHelper args={[20, 16, 20, 16]}/>
    {/if}

    {#each _sceneData.options as option, i (i)}
        {#if option.type === "popup"}
            <CssObject position={positions[i]}
                       center={[0, 0]}
                       rotation={rotations[i]}
                       pointerEvents={true}
            >
                <div class="bg-surface text-white -translate-x-1/2 {option.rounded ? `rounded-full` : ``} {option.animated ? `animate-pulse-btn` : ``}">
                    <button class="p-2" on:click={() => alert("button clicked")}>
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
                    <button class="p-2" on:click={() =>{
                        sceneData = getScene(option.nextSceneId);
                    }}>
                        <i class="fa fa-chevron-down fa-lg"></i>
                    </button>
                </div>
            </CssObject>
        {/if}
    {/each}

    <Pane
            theme={ThemeUtils.presets.light}
            position="fixed"
            title="test"
    >
        <Checkbox bind:value={perf} label="Performance"/>
        <Wheel label="Segments W" min={0} max={120} step={1} bind:value={sphereSegmentsW}/>
        <Wheel label="Segments H" min={0} max={120} step={1} bind:value={sphereSegmentsH}/>
        <Slider label="Lighting" min={0} max={10} step={0.1} bind:value={lighting}/>
        <Checkbox bind:value={grid} label="Grid"/>
        <Wheel bind:value={cameraFov} format={(v) => `${v}°`} label="Camera FOV" step={1}/>
        {#each _sceneData.options as _, i (i)}
            <Folder title={_sceneData.options[i].text} expanded={false}>
                {#if _sceneData.options[i].type === "navigation"}
                    <RotationEuler bind:value={rotations[i]}
                                   expanded={false}
                                   label="Rotation"
                                   picker={'inline'}
                    />
                {/if}
                <Point bind:value={positions[i]}
                       expanded={false}
                       label="Position"
                       picker="inline"
                       userExpandable={false}
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
                        rotation: [0, 0, 0]
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