const API_ENDPOINT = "https://hcmue-360-backend-production.up.railway.app";


export const authenticate = async (username, password) => {
    return await fetch(`${API_ENDPOINT}/auth`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username, password: password }),
    })
        .then((response) => response.status === 200);
};


export const getScene = async (sceneId) => {
    return await fetch(`${API_ENDPOINT}/scenes/${sceneId}`)
        .then((response) => response.json());
};

export const getScenes = async () => {
    return await fetch(`${API_ENDPOINT}/scenes`)
        .then((response) => response.json());
};

export const updateScene = async (sceneId, scene) => {
    return await fetch(`${API_ENDPOINT}/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(scene),
    })
        .then((response) => response.json());
};