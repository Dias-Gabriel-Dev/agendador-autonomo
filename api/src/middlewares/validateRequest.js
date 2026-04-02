
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({ 
      sucesso: false,
      erro: "Dados de entrada inválidos",
      detalhes: error.errors
    });
  }
};