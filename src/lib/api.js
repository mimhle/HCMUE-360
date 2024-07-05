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

export const updateScene = async (sceneId, scene, _delete = false) => {
    return await fetch(`${API_ENDPOINT}/scenes/${sceneId}`, {
        method: _delete ? "DELETE" : "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("password"),
        },
        body: JSON.stringify(scene),
    })
        .then((response) => {
            if (response.status !== 200) {
                throw new Error(response.status.toString());
            }
            return response.json();
        });
};

export const addScene = async (scene) => {
    return await fetch(`${API_ENDPOINT}/scenes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("password"),
        },
        body: JSON.stringify(scene),
    })
        .then((response) => {
            if (response.status !== 201) {
                throw new Error(response.status.toString());
            }
            return scene;
        });
}