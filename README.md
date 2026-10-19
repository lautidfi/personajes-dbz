# Personajes de Dragon Ball Z

Aplicación web que presenta un catálogo interactivo de personajes de *Dragon Ball Z*. Los datos se obtienen de la [Dragon Ball API](https://dragonball-api.com/), y se muestran en tarjetas con imágenes y una vista ampliada para consultar información adicional de cada personaje.

## Requisitos

Para correr esta aplicación se necesita Docker instalado y funcionando.

### Windows

Instalar WSL 2 abriendo una terminal y ejecutando el comando:
```powershell
  wsl --install
```

Descargar e instalar [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/), e iniciarlo.

### Linux

Instalar Docker Engine siguiendo las instrucciones oficiales para tu distribución en la [documentación de Docker Engine](https://docs.docker.com/engine/install/).

Luego, iniciar el servicio de Docker abriendo una terminal y ejecutando el comando:
```
sudo systemctl start docker
```

### macOS

Descargar e instalar la versión correspondiente de [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/), e iniciarlo.

## Instrucciones para correr la aplicación

*Nota: En Linux, si el usuario no tiene permisos para ejecutar comandos de Docker sin privilegios elevados, anteponer sudo a los comandos docker. En Windows y macOS, ejecutar los comandos tal como aparecen.*

Abrir una terminal y navegar a la carpeta del proyecto con el comando:
```
cd <RUTA DEL PROYECTO>
```

Crear una imagen de la aplicación:
```
docker build -t personajes-dbz .
```

Crear e iniciar un contenedor de la imagen:
```
docker run -d -p 8080:80 --name personajes-dbz personajes-dbz
```

Abrir un navegador web y navegar a http://localhost:8080.

Para detener la aplicación, ejecutar:
```
docker stop personajes-dbz
```

Para volver a iniciarla:
```
docker start personajes-dbz
```
