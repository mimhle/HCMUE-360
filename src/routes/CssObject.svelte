<script>
    import { T } from "@threlte/core";
    import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
    import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

    export let pointerEvents = false;
    export let threeD = false;

    let element;

</script>

<div bind:this={element}
     style:pointer-events={pointerEvents ? 'auto' : 'none !important'}
     style:will-change="transform"
>
    <slot/>
</div>

{#if element}
    <T {...$$restProps}
       is={threeD ? CSS3DObject : CSS2DObject}
       args={[element]}
       let:ref
    >
        <slot name="three" {ref}/>
    </T>
{/if}
