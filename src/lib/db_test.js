import { persisted } from "svelte-persisted-store";
import { get } from "svelte/store";

const _DB = [
    {
        id: 1,
        name: "scene1",
        description: "scene1 description",
        image: "https://mimhle.github.io/HCMUE-360/testImg.jpg",
        options: [
            {
                text: "option1",
                type: "popup",
                position: [-30, -10, 40],
                rotation: [0, 0, 0],
                animated: true,
                rounded: false,
                popupText: "this is a popup text",
            },
            {
                text: "option2",
                type: "popup",
                position: [40, 10, 10],
                rotation: [0, 0, 0],
                animated: true,
                rounded: true,
                popupText: "i",
            },
            {
                text: "option3",
                type: "navigation",
                position: [-120, -30, 0],
                rotation: [-0.5 * Math.PI, Math.PI, 0.5 * Math.PI],
                animated: true,
                nextSceneId: 2,
            }
        ]
    },
    {
        id: 2,
        name: "scene2",
        description: "scene2 description",
        image: "https://mimhle.github.io/HCMUE-360/testImg2.jpg",
        options: [
            {
                text: "option1",
                type: "popup",
                position: [0, -10, 40],
                rotation: [0, 0, 0],
                animated: true,
                rounded: false,
                popupText: "this is a popup text",
            },
            {
                text: "option2",
                type: "popup",
                position: [40, 10, 0],
                rotation: [0, 0, 0],
                animated: true,
                rounded: true,
                popupText: "i",
            },
            {
                text: "option3",
                type: "navigation",
                position: [120, -30, 0],
                rotation: [-0.5 * Math.PI, Math.PI, 0.5 * Math.PI],
                animated: true,
                nextSceneId: 1,
            }
        ]
    }
];

const DB = persisted("db_test", _DB);

export const getScene = (sceneId) => {
    return JSON.parse(JSON.stringify(get(DB).find(scene => scene.id === sceneId)));
};

export const updateScene = (sceneId, scene) => {
    const index = get(DB).findIndex(scene => scene.id === sceneId);
    DB.update(db => {
        db[index] = scene;
        return db;
    });
};

export const getAllScenes = () => {
    return get(DB).map(scene => [scene.id, scene.name]);
};