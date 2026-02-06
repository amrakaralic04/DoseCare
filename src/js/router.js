const routes = new Map();
const protectedRoutes = new Set();

const registerRoute = (path, render, isProtected = false) => {
    routes.set(path, render);
    if (isProtected) {
        protectedRoutes.add(path);
    }
};

const resolveRoute = (hash) => {
    const path = hash.replace("#", "") || "/login";
    return routes.get(path);
};

const isProtectedRoute = (hash) => {
    const path = hash.replace("#", "") || "/login";
    return protectedRoutes.has(path);
};

const navigate = (path) => {
    window.location.hash = path;
};

export { registerRoute, resolveRoute, isProtectedRoute, navigate };