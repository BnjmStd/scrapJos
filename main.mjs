import { chromium } from "playwright";
import fs from "fs";

const principiosActivos = [
  "Alpelisib",
  "Fulvestrant",
  "Inavolisib",
  "Palbociclib",
];

const resultados = [];

function generarCSV(resultados, archivo = "resultados.csv") {
  const csvData = [
    "Registro,Nombre,Fecha Registro,Empresa,Principio Activo,Control Legal",
    ...resultados.map(
      (r) =>
        `${r.registro},${r.nombre},${r.fechaRegistro},${r.empresa},${r.principioActivo},${r.controlLegal}`
    ),
  ].join("\n");

  fs.writeFileSync(archivo, csvData);
  console.log(`Archivo CSV generado: ${archivo}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Espera global de 60 segundos
  page.setDefaultTimeout(60000);

  await page.goto("https://registrosanitario.ispch.gob.cl/");

  // Seleccionar el checkbox de "Principio Activo"
  await page.waitForSelector("#ctl00_ContentPlaceHolder1_chkTipoBusqueda_1");
  await page.check("#ctl00_ContentPlaceHolder1_chkTipoBusqueda_1");

  for (const principio of principiosActivos) {
    console.log(`Buscando principio activo: ${principio}`);

    // Esperar y llenar el campo de texto
    await page.waitForSelector("#ctl00_ContentPlaceHolder1_txtPrincipio");
    await page.fill("#ctl00_ContentPlaceHolder1_txtPrincipio", principio);

    // Simular el clic en el botón de búsqueda
    await page.click("#ctl00_ContentPlaceHolder1_btnBuscar");

    // Esperar que el indicador de carga desaparezca
    await page.waitForLoadState("networkidle");

    // Verificar si la tabla existe
    const tablaVisible = await page.isVisible(
      "#ctl00_ContentPlaceHolder1_gvDatosBusqueda"
    );

    if (!tablaVisible) {
      console.log(`No se encontraron resultados para: ${principio}`);
      continue;
    }

    // Extraer los datos de la tabla
    const datos = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        "#ctl00_ContentPlaceHolder1_gvDatosBusqueda tbody tr"
      );
      const resultados = [];
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length > 0) {
          resultados.push({
            registro: cells[1]?.innerText.trim(),
            nombre: cells[2]?.innerText.trim(),
            fechaRegistro: cells[3]?.innerText.trim(),
            empresa: cells[4]?.innerText.trim(),
            principioActivo: cells[5]?.innerText.trim(),
            controlLegal: cells[6]?.innerText.trim(),
          });
        }
      });
      return resultados;
    });

    resultados.push(...datos);

    console.log(`Resultados obtenidos para: ${principio}`);
  }

  await browser.close();

  generarCSV(resultados);
})();


/*


import { extract } from "@extractus/article-extractor"

const article = await extract()

console.log(article)


*/