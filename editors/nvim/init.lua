-- Bootstrap lazy.nvim (plugin manager)
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- APL filetypes
vim.filetype.add({
  extension = {
    apl = 'apl',
    aplf = 'apl',
    aplo = 'apl',
    apln = 'apl',
    apla = 'apl',
    aplscript = 'apl',
    dyalog = 'apl',
  },
})

-- Plugins
require("lazy").setup({
  {
    "nvim-treesitter/nvim-treesitter",
    branch = "main",
    build = ":TSUpdate",
    config = function()
      local filetypes = { "lua", "python", "javascript", "c", "bash", "markdown" }
      require("nvim-treesitter").install(filetypes)

      local filetypes1 = vim.list_extend(vim.deepcopy(filetypes), { "apl" })
      vim.api.nvim_create_autocmd("FileType", {
        pattern = filetypes1,
        callback = function()
          vim.treesitter.start()

	  -- folding
	  vim.wo[0][0].foldmethod = "expr"
	  vim.wo[0][0].foldexpr = "v:lua.vim.treesitter.foldexpr()"

	  -- indentation
	  vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
   	end,
      })
    end,
  },
})

vim.api.nvim_create_autocmd("User", {
  pattern = "TSUpdate",
  callback = function()
    require("nvim-treesitter.parsers").apl = {
      install_info = {
        url = "https://github.com/dyalog-labs/tree-sitter-apl",
	branch = "master",
        queries = "queries",
      },
    }
  end,
})

vim.cmd([[colorscheme koehler]])

-- Nice and simple folding
vim.o.foldenable = true
vim.o.foldlevel = 99
vim.o.foldmethod = "expr"
vim.o.foldexpr = "v:lua.vim.treesitter.foldexpr()"

-- Indenting
vim.opt.tabstop=4
vim.opt.shiftwidth=4

