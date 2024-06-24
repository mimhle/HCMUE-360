<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";

    let height = 0;
    onMount(() => {
        height = window.innerHeight;
    })
</script>

<h1 class="h1 absolute">TEST TEST</h1>

<div id="css-renderer-target-2d" class="absolute top-0 right-0 pointer-events-none"></div>
<div id="css-renderer-target-3d" class="absolute top-0 right-0 pointer-events-none"></div>

<div style={`height: ${height}px;`}>
    <Canvas>
        <Scene/>
    </Canvas>
</div>