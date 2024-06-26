const DB = [
    {
        id: 1,
        name: "scene1",
        description: "scene1 description",
        image: "https://github.com/mimhle/HCMUE-360/blob/main/src/lib/assets/testImg.jpg?raw=true",
        options: [
            {
                text: "option1",
                type: "popup",
                position: [-30, -10, 40],
                center: [0, 0, 0],
                rotation: [0, 0, 0],
                animated: true,
                rounded: false,
                popupText: "this is a popup text",
            },
            {
                text: "option2",
                type: "popup",
                position: [40, 10, 10],
                center: [0, 0, 0],
                rotation: [0, 0, 0],
                animated: true,
                rounded: true,
                popupText: "i",
            },
            {
                text: "option3",
                type: "navigation",
                position: [-120, -30, 0],
                center: [0, 0, 0],
                rotation: [-0.5*Math.PI, Math.PI, 0.5*Math.PI],
                animated: true,
                nextSceneId: 2,
            }
        ]
    },
    {
        id: 2,
        name: "scene2",
        description: "scene2 description",
        image: "https://github.com/mimhle/HCMUE-360/blob/main/src/lib/assets/testImg2.jpg?raw=true",
        options: [
            {
                text: "option1",
                type: "popup",
                position: [0, -10, 40],
                center: [0, 0, 0],
                rotation: [0, 0, 0],
                animated: true,
                rounded: false,
                popupText: "this is a popup text",
            },
            {
                text: "option2",
                type: "popup",
                position: [40, 10, 0],
                center: [0, 0, 0],
                rotation: [0, 0, 0],
                animated: true,
                rounded: true,
                popupText: "i",
            },
            {
                text: "option3",
                type: "navigation",
                position: [120, -30, 0],
                center: [0, 0, 0],
                rotation: [-0.5*Math.PI, Math.PI, 0.5*Math.PI],
                animated: true,
                nextSceneId: 1,
            }
        ]
    }
];


export const getScene = (sceneId) => {
    return DB.find(scene => scene.id === sceneId);
};