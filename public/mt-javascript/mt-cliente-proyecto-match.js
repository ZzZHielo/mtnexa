/** SQL: correlación cliente ↔ proyecto por email o empresa+nombre+apellido */
function clienteProyectoMatchSql(cAlias = 'c', pAlias = 'p') {
  return `(
    (${cAlias}.email <> '' AND ${pAlias}.email <> ''
      AND LOWER(TRIM(${pAlias}.email)) = LOWER(TRIM(${cAlias}.email)))
    OR (
      ${cAlias}.empresa <> '' AND ${pAlias}.empresa <> ''
      AND LOWER(TRIM(${pAlias}.empresa)) = LOWER(TRIM(${cAlias}.empresa))
      AND LOWER(TRIM(${pAlias}.nombre)) = LOWER(TRIM(${cAlias}.nombre))
      AND LOWER(TRIM(IFNULL(${pAlias}.apellido, ''))) = LOWER(TRIM(IFNULL(${cAlias}.apellido, '')))
    )
  )`;
}

module.exports = { clienteProyectoMatchSql };
