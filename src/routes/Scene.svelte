<script>
    import { T, useTask, useThrelte } from "@threlte/core";
    import { Gizmo, interactivity, OrbitControls } from "@threlte/extras";
    import * as THREE from "three";
    import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
    import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
    import CssObject from "./CssObject.svelte";
    import { onMount } from "svelte";
    import {
        Button, ButtonGrid,
        Checkbox,
        Element, Folder, List,
        Pane, Point, RadioGrid,
        RotationEuler, Separator,
        Slider, Text, Textarea,
        ThemeUtils,
        Wheel
    } from "svelte-tweakpane-ui";
    import { getScenes, getScene, updateScene, addScene } from "$lib/api.js";
    import { easeOutExpo } from "$lib/utils.js";
    import Popover from "./Popover.svelte";

    interactivity();

    export let sceneData;
    export let perf = true;

    let _sceneData;

    let initLoad = true;

    let transition_d = 0;
    let sourceVector = null;
    let destinationVector = null;
    let afterTransition = null;

    let hideDebug = false;
    let gizmo = true;
    let lighting = Math.PI;
    let grid = false;
    let wireframe = false;
    let cameraOffset = 1;
    let cameraFov = 140;
    let sphereRadius = 100;
    let sphereSegmentsW = 48;
    let sphereSegmentsH = 48;
    let cameraRef = null;
    let cameraControlRef = null;

    let buttonRefs = [];

    let newType = "Popup";
    let newText = "";
    let newNextId = 1;
    let newAnimated = true;
    let newRounded = true;
    let allScene = [];

    let newSceneUrl = "";
    let newSceneName = "";
    let newSceneDesc = "";

    let positions = [];
    let positionsPolar = [];
    let rotations = [];
    let optionsDisabled = true;

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
                if (initLoad) cameraFov = 140 + (60 - 140) * ease;
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
            camera.current.position.set(0, 90, 0);
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

    $: if (sceneData && typeof window !== "undefined") {
        processSceneData(sceneData);
    }

    $: if (positionsPolar.length > 0) {
        setPositions(positionsPolar);
    }

    const setPositions = (positionsPolar) => {
        positions = positionsPolar.map(polar => {
            const spherical = new THREE.Spherical(100, polar[1], polar[0]);
            const result = new THREE.Vector3().setFromSpherical(spherical);
            return [result.x, result.y, result.z];
        });
    };

    const zoom = (delta) => {
        if (cameraRef !== null && !optionsDisabled) {
            const min = 10;
            const max = 60;
            camera.current.fov += delta * 0.008;
            camera.current.fov = Math.max(min, Math.min(max, camera.current.fov));
            rotateSpeed = -0.25 * (camera.current.fov / max);
            cameraRef.updateProjectionMatrix();
        }
    };

    const processSceneData = (data) => {
        if (data) {
            disableControl();
            resetCamera();
            new THREE.TextureLoader().load(data.image, (t) => {
                texture = t;
                texture.colorSpace = THREE.SRGBColorSpace;
                positionsPolar = data.options.map(option => {
                    const spherical = new THREE.Spherical().setFromCartesianCoords(option.position[0], option.position[1], option.position[2]);
                    return [spherical.theta, spherical.phi];
                });
                rotations = data.options.map(option => option.rotation);
                _sceneData = sceneData;
                if (!initLoad) enableControl();
                getScenes().then(scenes => {
                    allScene = scenes.map(scene => [`${scene.name} (${scene.id})`, scene.id, scene.name, scene?.description ?? ""]);
                    newNextId = allScene.filter(scene => scene[1] !== _sceneData.id)[0][1];

                    if (initLoad) {
                        setTimeout(() => {
                            moveCamera(new THREE.Vector3(0, 0, 1), () => {
                                initLoad = false;
                                enableControl();
                            });
                        }, 100);
                    }
                });
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
        _sceneData.options = _sceneData.options.map((option, i) => {
            option.position = positions[i];
            option.rotation = rotations[i];
            return option;
        });
        texture = null;
        disableControl();
        updateScene(_sceneData.id, _sceneData).then(result => {
            sceneData = result;
        }).catch(e => {
            if (e.message === "401") {
                sceneData = _sceneData;
            } else {
                alert(`Error saving scene, error: ${e.message}`);
            }
        });
    };

    const resetCamera = () => {
        if (cameraControlRef) {
            camera.current.position.set(0, 0, cameraOffset);
            cameraControlRef.update();
        }
    };

    const disableControl = (disableOption = true) => {
        if (disableOption) optionsDisabled = true;
        if (cameraControlRef) cameraControlRef.enabled = false;
    };

    const enableControl = () => {
        optionsDisabled = false;
        if (cameraControlRef) cameraControlRef.enabled = true;
    };


</script>

<T.PerspectiveCamera
        makeDefault
        fov={cameraFov}
        near={1}
        far={1000}
        bind:ref={cameraRef}
>
    <OrbitControls enableDamping
                   dampingFactor={0.1}
                   rotateSpeed={rotateSpeed}
                   enablePan={false}
                   enableZoom={false}
                   enabled={false}
                   bind:ref={cameraControlRef}/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={lighting}/>

{#if gizmo}
    <Gizmo
            horizontalPlacement="left"
            paddingX={20}
            paddingY={20}
    />
{/if}

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
                    <div class="bg-surface text-white -translate-x-1/2 {option.rounded ? `rounded-[50%]` : ``} {option.animated ? `[&:not(:hover)]:animate-pulse-btn` : ``}">
                        <Popover arrowX="center" placementX="center">
                            <button slot="target" class="p-2 overflow-hidden w-10 h-10" on:click={() =>{
                                const newVector = new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]);
                                newVector.normalize();
                                newVector.negate();
                                disableControl(false);

                                moveCamera(newVector, () => {
                                    alert("button clicked");
                                    enableControl();
                                });
                            }} on:wheel={(e) => {
                                zoom(e.deltaY);
                            }} bind:this={buttonRefs[i]}>
                                <i class="fa fa-info fa-lg"></i>
                            </button>
                            <div slot="content" class="bg-surface rounded-lg p-3 w-max max-w-[60vw] !pointer-events-auto inline-block">
                                {option.text}
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec purus
                                    ultricies, ultricies nunc nec, ultricies nunc. Nullam nec purus ultricies,
                                    ultricies nunc nec, ultricies nunc.
                                </p>
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec purus
                                    ultricies, ultricies nunc nec, ultricies nunc. Nullam nec purus ultricies,
                                    ultricies nunc nec, ultricies nunc.
                                </p>
                            </div>
                        </Popover>

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
                            disableControl(false);
                            buttonRefs[i].disabled = true;

                            moveCamera(newVector, () => {
                                texture = null;
                                getScene(option.nextSceneId).then(result => {
                                    sceneData = result;
                                });
                            });
                        }} on:wheel={(e) => {
                            zoom(e.deltaY);
                        }} bind:this={buttonRefs[i]}>
                            <i class="fa fa-chevron-down fa-lg"></i>
                        </button>
                    </div>
                </CssObject>
            {/if}
        {/each}
    {/if}

    {#if !hideDebug}
        <Pane
                theme={ThemeUtils.presets.light}
                position="fixed"
                title="Debug menu, remove before production"
                width={270}
        >
            <Button title="Hide debug menu" on:click={() => {
                hideDebug = true;
            }}/>
            <Checkbox bind:value={perf} label="Performance"/>
            <Checkbox bind:value={gizmo} label="Gizmo"/>
            <Wheel label="Camera offset" step={1} bind:value={cameraOffset}/>
            <Wheel label="Camera FOV" step={1} bind:value={cameraFov}/>
            <Wheel label="Segments W" min={0} max={120} step={1} bind:value={sphereSegmentsW}/>
            <Wheel label="Segments H" min={0} max={120} step={1} bind:value={sphereSegmentsH}/>
            <Slider label="Lighting" min={0} max={10} step={0.1} bind:value={lighting}/>
            <Checkbox bind:value={grid} label="Grid"/>
            <Checkbox bind:value={wireframe} label="Wireframe"/>
            <Folder title="Options" expanded={false}>
                {#each _sceneData.options as option, i (`${i}_${option.text}`)}
                    <Folder title={_sceneData.options[i].text} expanded={false}>
                        {#if _sceneData.options[i].type === "navigation"}
                            <List label="Next scene" bind:value={_sceneData.options[i].nextSceneId} options={Object.fromEntries(allScene.filter(scene => scene[1] !== _sceneData.id).map(scene => scene.slice(0, 2)))}/>
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
                        <ButtonGrid buttons={["Delete", "Locate"]} on:click={e => {
                            if (e.detail.label === "Delete") {
                                _sceneData.options = _sceneData.options.filter((_, j) => j !== i);
                                positions = positions.filter((_, j) => j !== i);
                                positionsPolar = positionsPolar.filter((_, j) => j !== i);
                                rotations = rotations.filter((_, j) => j !== i);
                            } else if (e.detail.label === "Locate") {
                                const newVector = new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]);
                                newVector.normalize();
                                newVector.negate();
                                moveCamera(newVector, () => {});
                            }
                        }}/>
                    </Folder>
                {/each}
                <Separator/>
                <Folder title="Add option" expanded={false}>
                    <RadioGrid bind:value={newType} values={["Popup", "Navigation"]}/>
                    {#if newType === "Popup"}
                        <Text label="Name" bind:value={newText}/>
                        <Checkbox label="Rounded" bind:value={newRounded}/>
                        <Checkbox label="Animated" bind:value={newAnimated}/>
                    {:else if newType === "Navigation"}
                        <Text label="Name" bind:value={newText}/>
                        <List label="Next scene" bind:value={newNextId} options={Object.fromEntries(allScene.filter(scene => scene[1] !== _sceneData.id).map(scene => scene.slice(0, 2)))}/>
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
                            positionsPolar = [...positionsPolar, [0, 0]]
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
                            positionsPolar = [...positionsPolar, [0, 0]]
                            rotations.push([0, 0, 0]);
                        }
                    }}/>
                </Folder>
            </Folder>
            <Folder title="Scenes" expanded={false}>
                {#if allScene.length}
                    {#each allScene as [_, id, name, desc], i (`${id}_${_}_${i}}`)}
                        <Folder title={name + (id === _sceneData.id ? " (*)" : "")} expanded={false}>
                            <Text label="Id" value={id.toString()} disabled/>
                            {#if id === _sceneData.id}
                                <Text label="Description" bind:value={_sceneData.description}/>
                            {:else}
                                <Text label="Description" value={desc} disabled/>
                            {/if}
                            {#if id !== _sceneData.id}
                                <ButtonGrid buttons={["Delete", "Go"]} on:click={e => {
                                    if (e.detail.label === "Delete") {
                                        if (confirm("Are you sure you want to delete this scene?\nChanges will apply immediately.\nPlease remove any references to this scene before deleting to avoid any error.")) {
                                            updateScene(id, {}, true).then(() => {
                                                allScene = allScene.filter(scene => scene[1] !== id);
                                            }).catch(e => {
                                                if (e.message === "401") alert("You are not authorized to delete this scene");
                                                else alert(`Error deleting scene, error: ${e.message}`);
                                            });
                                        }
                                    } else if (e.detail.label === "Go") {
                                        texture = null;
                                        disableControl();
                                        getScene(id).then(result => {
                                            sceneData = result;
                                        });
                                    }
                                }}/>
                            {/if}
                        </Folder>
                    {/each}
                {/if}
                <Separator/>
                <Folder title="Add scene" expanded={false}>
                    <Text label="Url" bind:value={newSceneUrl}/>
                    <Text label="Name" bind:value={newSceneName}/>
                    <Textarea label="Description" bind:value={newSceneDesc} placeholder="Description (optional)"/>
                    <Button title="Add" on:click={() => {
                        if (newSceneUrl === "" || newSceneName === "") return;
                        const newScene = {
                            name: newSceneName,
                            description: newSceneDesc,
                            image: newSceneUrl,
                            options: []
                        };
                        addScene(newScene).then(result => {
                            allScene = [...allScene, [`${result.name} (${result.id})`, result.id, result.name, result?.description]];
                        }).catch(e => {
                            alert(`Error adding scene, error: ${e.message}`);
                        });
                    }}/>
                </Folder>
            </Folder>
            <Separator/>
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
                <Text label="From url: " bind:value={newSceneUrl}/>
                <Button title="Load" on:click={() => {
                    texture = null;
                    new THREE.TextureLoader().load(newSceneUrl, (t) => {
                        texture = t;
                        texture.colorSpace = THREE.SRGBColorSpace;
                    });
                }}/>
            </Folder>
            <Button title="Save" on:click={save}/>
        </Pane>
    {/if}
{/if}