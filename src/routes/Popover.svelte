<script>
    import { fade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";

    export let arrowX = "left";
    export let placementX = "left";
    export let arrowClass = "";
    export let disabled = false;

    let _ref;
    let target;

    let hidden = true;

    let arrowY = "top";

    let offsetX = "";

    let timeout;

    const updatePosition = () => {
        if (_ref && target && !disabled) {
            if (arrowX === "left") {
                if (placementX === "left") {
                    _ref.style.setProperty("left", target.offsetLeft + "px");
                } else if (placementX === "center") {
                    _ref.style.setProperty("left", target.offsetLeft + target.offsetWidth / 2 + "px");
                    offsetX = "-translate-x-[0.9rem]";
                } else if (placementX === "right") {
                    _ref.style.setProperty("left", target.offsetLeft + target.offsetWidth + "px");
                    offsetX = "-translate-x-[1.55rem]";
                }
            } else if (arrowX === "center") {
                if (placementX === "left") {
                    _ref.style.setProperty("left", target.offsetLeft - _ref.offsetWidth / 2 + "px");
                    offsetX = "translate-x-[0.9rem]";
                } else if (placementX === "center") {
                    _ref.style.setProperty("left", target.offsetLeft + target.offsetWidth / 2 - _ref.offsetWidth / 2 + "px");
                } else if (placementX === "right") {
                    _ref.style.setProperty("left", target.offsetLeft + target.offsetWidth - _ref.offsetWidth / 2 + "px");
                    offsetX = "-translate-x-[0.9rem]";
                }
            } else if (arrowX === "right") {
                if (placementX === "left") {
                    _ref.style.setProperty("right", window.innerWidth - target.offsetLeft + "px");
                    offsetX = "translate-x-[1.55rem]";
                } else if (placementX === "center") {
                    _ref.style.setProperty("right", window.innerWidth - (target.offsetLeft + target.offsetWidth / 2) + "px");
                    offsetX = "translate-x-[0.9rem]";
                } else if (placementX === "right") {
                    _ref.style.setProperty("right", window.innerWidth - (target.offsetLeft + target.offsetWidth) + "px");
                }
            }

            if (target.getBoundingClientRect().top + target.offsetHeight + _ref.offsetHeight > window.innerHeight) {
                _ref.style.setProperty("top", target.offsetTop - _ref.offsetHeight + "px");
                arrowY = "bottom";
            } else {
                _ref.style.setProperty("top", target.offsetTop + target.offsetHeight + "px");
                arrowY = "top";
            }

            // TODO: move when off screen horizontally
        }
    };

    const onHover = () => {
        updatePosition();
        show();
    };

    const onLeave = () => {
        hide();
    };

    const show = () => {
        if (timeout) clearTimeout(timeout);
        hidden = false;
    };

    const hide = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            hidden = true;
        }, 10);
    };

</script>

<div class="h-fit">
    <div class="w-fit max-w-full"
         on:mouseover={onHover}
         on:mouseleave={onLeave}
         on:focus={onHover}
         on:focusin={onHover}
         on:blur={onLeave}
         on:mousemove={updatePosition}
         bind:this={target}
         role="button"
         tabindex="-1"
    >
        <slot name="target"></slot>
    </div>
    {#if !hidden && !disabled}
        <div class={`absolute flex flex-col z-[999] w-fit cursor-default ${offsetX}`}
             transition:fade={{ duration: 150, easing: cubicInOut }}
             on:focus={onHover}
             on:focusin={onHover}
             on:focusout={onLeave}
             on:mouseover={onHover}
             on:mouseleave={onLeave}
             bind:this={_ref}
             role="button"
             tabindex="-1"
        >
            {#if arrowY === "bottom"}
                <div>
                    <slot name="content"></slot>
                </div>
            {/if}
            <div class={`flex flex-row w-full ${arrowX === "left" ?  "justify-start" : (arrowX === "right" ? "justify-end" : "justify-center")}`}>
                <div class={`h-0 w-0 border-x-8 border-x-transparent ${arrowY === "top" ? "border-b-8 border-b-surface-500" : "border-t-8 border-t-surface-500"} ${arrowX === "left" ?  "translate-x-2" : (arrowX === "right" ? "-translate-x-2" : "")} ${arrowClass}`}></div>
            </div>
            {#if arrowY === "top"}
                <div>
                    <slot name="content"></slot>
                </div>
            {/if}
        </div>
    {/if}
</div>
