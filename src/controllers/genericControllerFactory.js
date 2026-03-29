export function createModuleController(moduleName) {
  return {
    list: async (_req, res) => res.status(200).json({ module: moduleName, items: [] }),
    detail: async (req, res) => res.status(200).json({ module: moduleName, id: req.params.id }),
    create: async (req, res) => res.status(201).json({ module: moduleName, payload: req.body }),
    update: async (req, res) =>
      res.status(200).json({ module: moduleName, id: req.params.id, payload: req.body }),
    remove: async (req, res) => res.status(200).json({ module: moduleName, id: req.params.id })
  };
}
