import React from 'react';
import { MainCampusHome } from './MainCampusHome';

export const DashboardRouter = () => {
  // La pantalla de inicio de la plataforma otorga el rol protagónico y central al Tutor IA,
  // adaptando las herramientas complementarias (biblioteca, materias, administración) según el rol del usuario.
  return <MainCampusHome />;
};
