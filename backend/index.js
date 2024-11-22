const express = require('express');
const cors = require('cors');
const Sequelize = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize('saep', 'root', 'Denuffy321*', {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306
});

// Definindo os modelos
const Curso = sequelize.define('curso', {
    id_curso: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    foto: Sequelize.TEXT,
    nome_curso: Sequelize.TEXT,
    instituicao: Sequelize.TEXT,
    empresa_id: Sequelize.INTEGER
}, { freezeTableName: true, timestamps: false });

const Empresa = sequelize.define('empresa', {
    id_empresa: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    nome: Sequelize.TEXT,
    logo: Sequelize.TEXT
}, { freezeTableName: true, timestamps: false });

const Usuario = sequelize.define('usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    nome: Sequelize.TEXT,
    email: Sequelize.TEXT,
    nickname: Sequelize.TEXT,
    senha: Sequelize.INTEGER,
    foto: Sequelize.TEXT,
    createdAt: Sequelize.TEXT,
    updatedAt: Sequelize.TEXT
}, { freezeTableName: true, timestamps: false });

const Inscricao = sequelize.define('inscricao', {
    id_inscricao: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    usuario_id: Sequelize.INTEGER,
    curso_id: Sequelize.INTEGER,
}, { freezeTableName: true, timestamps: false });

const Comentario = sequelize.define('comentario', {
    id_comentario: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    curso_id: Sequelize.INTEGER,
    usuario_id: Sequelize.INTEGER,
    texto: Sequelize.TEXT,
}, { freezeTableName: true, timestamps: false });

// Relacionamentos
Curso.hasMany(Inscricao, { foreignKey: 'curso_id' });
Curso.hasMany(Comentario, { foreignKey: 'curso_id' });
Usuario.hasMany(Inscricao, { foreignKey: 'usuario_id' });
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id' });

// Definindo a associação entre Comentario e Usuario
Comentario.belongsTo(Usuario, { foreignKey: 'usuario_id' });  // Comentário pertence a um usuário
// Também é necessário definir a associação inversa no modelo Usuario
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id' });  // Usuário tem muitos comentários

// Inicializando o app Express
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rota para listar usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const listaUsuarios = await Usuario.findAll();
        res.json(listaUsuarios);
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({ error: "Erro ao listar usuários" });
    }
});

// Rota de login
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { email, senha } });
        if (usuario) {
            res.json({ success: true, user: usuario });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ error: "Erro ao fazer login" });
    }
});
app.get('/api/cursos', async (req, res) => {
    try {
        const cursos = await Curso.findAll({
            include: [
                {
                    model: Inscricao,
                    attributes: ['id_inscricao'],
                },
                {
                    model: Comentario,
                    attributes: ['id_comentario'],
                },
            ],
        });

        const cursosComDados = cursos.map((curso) => ({
            id_curso: curso.id_curso,
            nome_curso: curso.nome_curso,
            foto: curso.foto,
            instituicao: curso.instituicao,
            numInscritos: curso.inscricaos.length, // Número de inscrições
            numComentarios: curso.comentarios.length, // Número de comentários
        }));

        res.json(cursosComDados);
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
});

// Rota para obter dados da empresa
app.get('/api/empresa', async (req, res) => {
    try {
        const empresa = await Empresa.findOne(); // busca a primeira empresa
        res.json(empresa);
    } catch (error) {
        console.error("Erro ao buscar dados da empresa:", error);
        res.status(500).json({ error: "Erro ao buscar dados da empresa" });
    }
});
// Rota para obter cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const cursos = await Curso.findAll(); // Obtém todos os cursos
        res.json(cursos);
    } catch (error) {
        console.error("Erro ao buscar cursos:", error);
        res.status(500).json({ error: "Erro ao buscar cursos" });
    }
});
// Rota para obter dados de um usuário específico
app.get('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const usuario = await Usuario.findByPk(id); // Busca um usuário pelo ID
        if (usuario) {
            res.json(usuario);
        } else {
            res.status(404).json({ error: "Usuário não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});
// Rota para inscrição em curso
app.post('/api/inscricao', async (req, res) => {
    const { usuario_id, curso_id } = req.body;
    try {
        // Verifica se o usuário já está inscrito no curso
        const inscricaoExistente = await Inscricao.findOne({
            where: { usuario_id, curso_id }
        });

        if (inscricaoExistente) {
            return res.status(400).json({ error: 'Você já está inscrito neste curso.' });
        }

        // Cria a inscrição no banco de dados
        const novaInscricao = await Inscricao.create({
            usuario_id,
            curso_id
        });

        res.json({ success: true, inscricao: novaInscricao });
    } catch (error) {
        console.error('Erro ao realizar inscrição:', error);
        res.status(500).json({ error: 'Erro ao realizar inscrição' });
    }
});

// Verifica se o usuário está inscrito no curso
app.get('/api/inscricao/:usuario_id/:curso_id', async (req, res) => {
    const { usuario_id, curso_id } = req.params;
    try {
        const inscricao = await Inscricao.findOne({
            where: {
                usuario_id,
                curso_id
            }
        });

        console.log({inscrito: !!inscricao, curso:curso_id})

        res.json({ inscrito: !!inscricao }); // Retorna true se estiver inscrito, caso contrário false
    } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
        res.status(500).json({ error: 'Erro ao verificar inscrição' });
    }
});


// Rota para desinscrição de um curso
app.delete('/api/inscricao/:usuario_id/:curso_id', async (req, res) => {
    const { usuario_id, curso_id } = req.params;
    try {
        // Tenta encontrar e excluir a inscrição
        const inscricao = await Inscricao.findOne({ where: { usuario_id, curso_id } });

        if (inscricao) {
            await inscricao.destroy();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Inscrição não encontrada' });
        }
    } catch (error) {
        console.error('Erro ao excluir inscrição:', error);
        res.status(500).json({ error: 'Erro ao excluir inscrição' });
    }
});

// Rota para criar um comentário
app.post('/api/comentario', async (req, res) => {
    const { curso_id, usuario_id, texto } = req.body;
    try {
        // Cria o novo comentário
        const novoComentario = await Comentario.create({
            curso_id,
            usuario_id,
            texto
        });

        // Busca os dados completos do usuário associado ao comentário
        const usuario = await Usuario.findByPk(usuario_id, {
            attributes: ['nome'] // Inclui apenas o campo necessário
        });

        // Retorna o comentário junto com o nome do usuário
        res.json({
            success: true,
            comentario: {
                id_comentario: novoComentario.id, // Inclui o ID do comentário
                texto: novoComentario.texto,
                usuario: { nome: usuario.nome } // Inclui o nome do usuário
            }
        });
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
});


// Endpoint para obter comentários de um curso específico
app.get('/api/comentarios/:curso_id', async (req, res) => {
    const { curso_id } = req.params;

    try {
        const comentarios = await Comentario.findAll({
            where: { curso_id },
            include: {
                model: Usuario, // Certifique-se de importar o modelo Usuario
                attributes: ['nome'], // Campos adicionais dos usuários
            },
        });

        res.json(comentarios);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

    



// Conexão com o banco de dados e sincronização dos modelos
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');

        await sequelize.sync();
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
    }
})();