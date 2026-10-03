import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProyectosIndex from "./pages/proyectos/Index";
import ProyectosCreate from "./pages/proyectos/Create";
import ProyectosShow from "./pages/proyectos/Show";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/proyectos"
                    element={<ProyectosIndex />}
                />

                <Route
                    path="/proyectos/create"
                    element={<ProyectosCreate />}
                />

                <Route
                    path="/proyectos/:id"
                    element={<ProyectosShow />}
                />

            </Routes>
        </BrowserRouter>
    );
}
