const axios = require("axios").default;
const jsdom = require("jsdom");
const fs = require("fs");

const { JSDOM } = jsdom;

const obtenerDiputados = (
  apellido = "",
  distrito = "",
  bloque = "",
  mandato = "",
  comision = ""
) => {
   axios
    .get(
      `https://www.hcdn.gob.ar/diputados/listadip.html?apellido=${apellido}&distrito=${distrito}&bloque=${bloque}&mandato=${mandato}&comision=${comision}`
    )
    .then((res) => {
      const { document } = new JSDOM(res.data).window;
      document
        .querySelectorAll("#tablaDiputados > tbody > tr > td > a")
        .forEach(async res => {
          await principal(res.href)
        });
    })
    .catch(error => console.log("Error"));
};

const limpiarPalabra = (palabra) => {
  let nuevaPalabra = palabra.trim();
  nuevaPalabra = nuevaPalabra.toUpperCase();
  nuevaPalabra = nuevaPalabra.replace(" ", " ");
  return nuevaPalabra;
};

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


const principal = async (id) => {
  const datosPersonales = {};
  await axios
    .get(`https://www.hcdn.gob.ar/diputados/${id}`)
    .then((res) => {
      const { document } = new JSDOM(res.data).window;
      const infoPersonal = document
        .querySelector("div.datosPersonales2.col-md-4.col-xs-12")
        .textContent.trim()
        .replace("Datos Personales", "")
        .replace("Distrito al que representa:", "")
        .replace("Interbloque", "")
        .replace("Profesión", "")
        .replace("Fecha de Nac.", "")
        .replace("Est.Civil", "")
        .replace("Hijos", "")
        .replace(/ /g, " ")
        .replace(/	/g, "")
        .replace(/\n/g, "")
        .split(":");
      datosPersonales.nombre = limpiarPalabra(
        document.querySelector(
          "div.detalleDip.container.appInvisiblea > div.col-sm-12.col-md-4 > h1"
        ).textContent
      );
      datosPersonales.distrito = limpiarPalabra(infoPersonal[0]);
      datosPersonales.interbloque = limpiarPalabra(infoPersonal[1]);
      datosPersonales.profesion = limpiarPalabra(infoPersonal[2]);
      datosPersonales.fechaDeNacimiento = limpiarPalabra(infoPersonal[3]);
      datosPersonales.periodo = limpiarPalabra(
        document
          .querySelector(
            "div.detalleDip.container.appInvisiblea > div.col-sm-12.col-md-4 > strong"
          )
          .textContent.replace("Período: ", "")
          .replace("-", "al")
      );
      datosPersonales.foto = document.querySelector(
        "div.detalleDip.container.appInvisiblea > div.col-sm-12.col-md-2.verticalPad > img"
      ).src;
    })
    .catch((error) => {
      console.log(error.response);
    });

  await axios
    .get(`https://www.hcdn.gob.ar/diputados/${id}/comisiones.html`)
    .then((res) => {
      const { document } = new JSDOM(res.data).window;
      datosPersonales.comisiones = [];
      document
        .querySelectorAll("#tablaComisiones > tbody > tr > td")
        .forEach((res) => {
          datosPersonales.comisiones.push(res.textContent);
        });
    })
    .catch((error) => {
      console.log(error.response);
    });

  await axios
    .get(
      `https://www.hcdn.gob.ar/diputados/${id}/listadodeproy.html?tipoFirmante=firmante`
    )
    .then((res) => {
      const { document } = new JSDOM(res.data).window;
      datosPersonales.proyectosAutor = parseInt(
        limpiarPalabra(
          document
            .querySelector("#principal-interno > div.container.interno > h3")
            .textContent.replace("Proyectos Encontrados", "")
        )
      );
    })
    .catch((error) => {
      console.log(error.response);
    });

  await axios
    .get(
      `https://www.hcdn.gob.ar/diputados/${id}/listadodeproy.html?tipoFirmante=cofirmante`
    )
    .then((res) => {
      const { document } = new JSDOM(res.data).window;
      datosPersonales.proyectosCoAutor = parseInt(
        limpiarPalabra(
          document
            .querySelector("#principal-interno > div.container.interno > h3")
            .textContent.replace("Proyectos Encontrados", "")
        )
      );
    })
    .catch((error) => {
      console.log(error.response);
    });
    datosPersonales.comisionesStr = "";
    for (let i = 0; i <= datosPersonales.comisiones.length - 2; i = i + 2) {
      datosPersonales.comisionesStr += `- ${limpiarPalabra(datosPersonales.comisiones[i])} \`\`\`(${capitalizeFirstLetter(limpiarPalabra(datosPersonales.comisiones[i + 1]))})\`\`\`\n`
    }

    const archivo = `---
title: "${datosPersonales.nombre}"
date: 2021-02-21T15:08:00-03:00
description: "✔ ${datosPersonales.interbloque} ✔ ${datosPersonales.distrito}"
draft: false
hideToc: false
enableToc: true
enableTocContent: false
tocLevels: ["h2", "h3", "h4", "h5"]
author: Administrador
authorEmoji: ✔
tags:
- ${datosPersonales.distrito}
series:
- ${datosPersonales.interbloque}
pinned: false
libraries:
- mermaid
image: ${datosPersonales.foto}
---

![${datosPersonales.nombre}](${datosPersonales.foto})

##### DATOS PERSONALES
**NOMBRE Y APELLIDO:** <i class="color-rosa">*${datosPersonales.nombre}*</i>
**DISTRITO AL QUE REPRESENTA:** <i class="color-rosa">*${datosPersonales.distrito}*</i>
**INTERBLOQUE:** <i class="color-rosa">*${datosPersonales.interbloque}*</i>
**PROFESIÓN:** <i class="color-rosa">*${datosPersonales.profesion}*</i>
**FECHA DE NAC.:** <i class="color-rosa">*${datosPersonales.fechaDeNacimiento}*</i>
**PERÍODO:** <i class="color-rosa">*${datosPersonales.periodo}*</i>
> https://www.hcdn.gob.ar/diputados/${id}

---
##### DATOS LEGISLATIVOS
###### COMISIONES
${datosPersonales.comisionesStr}
> https://www.hcdn.gob.ar/diputados/${id}/comisiones.html

---
##### PROYECTOS PRESENTADOS

**AUTOR:** <i class="color-rosa">${datosPersonales.proyectosAutor} Proyectos</i>
**COAUTOR:** <i class="color-rosa">${datosPersonales.proyectosCoAutor} Proyectos</i>
> https://www.hcdn.gob.ar/diputados/${id}/listadodeproy.html

---
##### ESTADÍSTICA DE ASISTENCIA
- **PERIODO 138 (01/03/2020 - 17/11/2020):** <i class="color-rosa">XX de XX sesiones. XX,XX% asistencia.</i>
- **PERIODO 137: SESIÓN PREPARATORIA (04/12/19) Y ASAMBLEA LEGISLATIVA (10/12/19):** <i class="color-rosa">XX de XX sesiones. XX,XX% asistencia.</i>
- **PERIODO 137 (01/03/19 - 20/11/19):** <i class="color-rosa">XX de XX sesiones. XX,XX% asistencia.</i>
- **PERIODO 136 (01/03/18 - 28/12/18):** <i class="color-rosa">XX de XX sesiones. XX,XX% asistencia.</i>
- **PERIODO 135 (14/12/17 - 21/12/17):** <i class="color-rosa">XX de XX sesiones. XX,XX% asistencia.</i>
- **PERIODO 135 SESIÓN PREPARATORIA (06/12/17):** <i class="color-rosa">XX de XX sesión. XX,XX% asistencia.</i>
- **TOTAL:** <i class="color-rosa">XX de XX. XX,XX% asistencia.</i>
> https://www.diputados.gov.ar/secparl/dclp/asistencia.html

---
##### OTRAS ACTIVIDADES
###### ACTIVIDAD PÚBLICA PREVIA
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX

###### ACTIVIDAD PARTIDARIA PREVIA
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX

###### ACTIVIDAD PRIVADA PREVIA
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX
- XXXXXXXXXXXXXXXXXXXXXXXXXX

---
##### ARCHIVOS
<style>
.contenedor {
    display: flex;
    flex-wrap: wrap;
}
.contenedor__elemento {
    text-align: -webkit-center;
}
.contenedor__elemento > p {
    margin:0.5em;
}
</style>
<div class="contenedor">
    <div class="contenedor__elemento">
        <a target="_blank" href="XXXXXXXXXXXXXXXXXXXXXX">
            <img width="128px" src="/images/pdf.png" style="margin: 0 1em;" />
        </a>
        <p class="contenedor__titulo">CURRICULUM VITAE</p>
    </div>
    <div class="contenedor__elemento">
        <a href="XXXXXXXXXXXXXXXXXXXXXX">
            <img width="128px" src="/images/pdf.png" style="margin: 0 1em;" />
        </a>
        <p class="contenedor__titulo">DECLARACION JURADA</p>
    </div>
</div>`;

fs.writeFile(`${id}.md`, archivo, (err) => {
  if (err) throw err;
  console.log(`Archivo ${id.toUpperCase()} actualizado Satisfactoriamente`);
})

};
const inicio = async () => {
/*
// ERROR  await principal("jcampos");
// ERROR  await principal("gafrizza");
// ERROR  await principal("mlehmannm");
// ERROR  await principal("mocana");
// ERROR  await principal("mvallejos");
// ERROR  await principal("nvilla");
// ERROR  await principal("gmedina");
// ERROR  await principal("jagarcia");
// ERROR  await principal("gdelcerro");
*/
/*  await principal("nabdaladem");
  await principal("haguirre");
  await principal("jaicega");
  await principal("jalderete");
  await principal("wallende");
  await principal("kalumes");
  await principal("dalvarez");
  await principal("malvarezr");
  await principal("damaya");
  await principal("fangelini");
  await principal("pansaloni");
  await principal("aaparicio");
  await principal("marce");
  await principal("lascarate");
  await principal("aasseff");
  await principal("baustin");
  await principal("bavila");
  await principal("aayala");
  await principal("hbaldassi");
  await principal("kbanfi");
  await principal("hbarbaro");
  await principal("mbazze");
  await principal("abenedetti");
  await principal("mberhongaray");
  await principal("hberisso");
  await principal("abermejo");
  await principal("cbernazza");
  await principal("rbertone");
  await principal("ebogdanich");
  await principal("lbormioli");
  await principal("sbrambilla");
  await principal("mbrawer");
  await principal("mbritez");
  await principal("ebrizueladelmoral");
  await principal("dbrue");
  await principal("ebucca");
  await principal("mburgos");
  await principal("rburyaile");
  await principal("acacace");
  await principal("acaceres");
  await principal("ecaceres");
  await principal("lcaliva");
  await principal("gcamano");
  await principal("mcampagnoli");
  await principal("jcano");
  await principal("acantard");
  await principal("mcaparros");
  await principal("acarambia");
  await principal("gcarnaghi");
  await principal("ncarrizo");
  await principal("mscarrizo");
  await principal("ccarrizo");
  await principal("jcarro");
  await principal("mcasaretto");
  await principal("scasas");
  await principal("gcaselles");
  await principal("pcassinerio");
  await principal("lcastets");
  await principal("gcerruti");
  await principal("gcipolini");
  await principal("ccisneros");
  await principal("mcleri");
  await principal("lcontigiani");
  await principal("vcornejo");
  await principal("acornejo");
  await principal("lcorpacci");
  await principal("wcorrea");
  await principal("ccrescimbeni");
  await principal("mcresto");
  await principal("rdaives");
  await principal("ndaldovo");
  await principal("adelamadrid");
  await principal("odemarchi");
  await principal("jdemendiguren");
  await principal("ndelcano");
  await principal("mdelu");
  await principal("luisdigiacomo");
  await principal("selsukaria");
  await principal("jenriquez");
  await principal("gestevez");
  await principal("eestevez");
  await principal("ffagioli");
  await principal("ofelix");
  await principal("hfernandez");
  await principal("egfernandez");
  await principal("cfernandez");
  await principal("eflangan");
  await principal("gfernandezp");
  await principal("mferraro");
  await principal("dferreyra");
  await principal("afigueroa");
  await principal("hflores");
  await principal("dflores");
  await principal("mfrade");
  await principal("afregonese");
  await principal("ffrigerio");
  await principal("agaillard");
  await principal("xgarcia");
  await principal("rgarciadeluca");
  await principal("sginocchio");
  await principal("jgioja");
  await principal("jgiordano");
  await principal("lgodoy");
  await principal("agonzalez");
  await principal("jvgonzalez");
  await principal("mgrande");
  await principal("lgrosso");
  await principal("aguevarao");
  await principal("cgutierrez");
  await principal("crgutierrez");
  await principal("ihagman");
  await principal("ghein");
  await principal("cheller");
  await principal("ehernandez");
  await principal("bherrera");
  await principal("faiglesias");
  await principal("sigon");
  await principal("ijetter");
  await principal("mjoury");
  await principal("ljuez");
  await principal("mkirchner");
  await principal("mkoenig");
  await principal("jlacoste");
  await principal("flampreabe");
  await principal("slandriscini");
  await principal("llaspina");
  await principal("jlatorre");
  await principal("mleito");
  await principal("aleiva");
  await principal("glena");
  await principal("julopez");
  await principal("mjlopez");
  await principal("dlopezrodriguez");
  await principal("slospennato");
  await principal("mmacha");
  await principal("rmanzi");
  await principal("mmaquieyra");
  await principal("cmarquez");
  await principal("jmartiarena");
  await principal("jmartin");
  await principal("gpmartinez");
  await principal("mrmartinez");
  await principal("mdmartinez");
  await principal("lmartinez");
  await principal("mmarziotta");
  await principal("mmasin");
  await principal("smassa");
  await principal("vmassetani");
  await principal("lmatzen");
  await principal("mmedina");
  await principal("jomendoza");
  await principal("gmenna");
  await principal("dmestre");
  await principal("mmoises");
  await principal("omonaldi");
  await principal("mmontoto");
  await principal("fmorales");
  await principal("vmoralesg");
  await principal("lmoreau");
  await principal("cmoreau");
  await principal("jmosqueda");
  await principal("pmounier");
  await principal("fmoyano");
  await principal("rmunoz");
  await principal("cnajul");
  await principal("mnanniv");
  await principal("gnavarro");
  await principal("eneder");
  await principal("mnegri");
  await principal("jnunez");
  await principal("aobeid");
  await principal("polivetol");
  await principal("cormachea");
  await principal("horrego");
  await principal("cortega");
  await principal("bosuna");
  await principal("mgparola");
  await principal("lpastori");
  await principal("jpatino");
  await principal("ppenacca");
  await principal("hparaujo");
  await principal("epertile");
  await principal("lpetri");
  await principal("mpiccolomini");
  await principal("camorimu");
  await principal("cponce");
  await principal("fquetglas");
  await principal("jramon");
  await principal("arauschenberger");
  await principal("eregidorb");
  await principal("mlrey");
  await principal("rreyes");
  await principal("drezinovsky");
  await principal("jriccardo");
  await principal("critondo");
  await principal("jrizzotti");
  await principal("aerodriguez");
  await principal("nrodriguezsaa");
  await principal("vromero");
  await principal("jaromero");
  await principal("vrosso");
  await principal("aruarte");
  await principal("jruiza");
  await principal("lrusso");
  await principal("jsahad");
  await principal("ssalvador");
  await principal("fsanchez");
  await principal("nsandg");
  await principal("asapag");
  await principal("jsarghini");
  await principal("dsartori");
  await principal("gscaglia");
  await principal("aschiavoni");
  await principal("dschlereth");
  await principal("mschwindt");
  await principal("cselva");
  await principal("vsiley");
  await principal("misoria");
  await principal("asposito");
  await principal("hstefani");
  await principal("mstilman");
  await principal("fsuarez");
  await principal("ltailhade");
  await principal("aterada");
  await principal("ptonelli");
  await principal("ptorello");
  await principal("itorres");
  await principal("mtundis");
  await principal("muceda");
  await principal("ruhrig");
  await principal("evaldes");
  await principal("jvara");
  await principal("jvazquez");
  await principal("jveron");
  await principal("mvessvessian");
  await principal("avigo");
  await principal("dvilar");
  await principal("cvivero");
  await principal("rwellbach");
  await principal("wwolff");
  await principal("eyacobitti");
  await principal("lyambrun");
  await principal("hyasky");
  await principal("pyedlin");
  await principal("iyutrovic");
  await principal("fzamarbide");
  await principal("mzottos");
  await principal("mzuvic");
*/
}
 inicio();