
export function globalErrorHandler(err, req, res, next) {
  console.error('Erro capturarado pelo Handler Global:', err.message);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Erro Interno do Servidor' : err.message;

  res.status(statusCode).json({ 
    sucess: false,
    erro: message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}