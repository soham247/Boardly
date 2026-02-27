const healthCheck = (req, res) => {
  return res.status(200).json({
    status: 'OK',
    message: 'Health check passed',
  });
};

export { healthCheck };
