import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Função do Header
function Header() {
    const instagram = "./instagram.webp"
    const twitter = "./twitter.png"
    return (
        <div className='header'>
            <h1>FaculHub – O Curso Certo Para Você</h1>
            <div>
                <img src={instagram} className="imagens" alt="insta" />
                <img src={twitter} className="imagens" alt="twitter" />
            </div>
        </div>
    );
}

// Função do Perfil
function Perfil({ foto, nome, openLoginModal, onLogout, usuarioLogado }) {
    return (
        <div className="perfil">
            {usuarioLogado ? (
                <>
                    <button onClick={onLogout}>Sair</button>
                    <img src={foto} id="faculHub" alt="Foto de perfil" />
                    <h1>{nome}</h1>
                    <p>Inscrições: 7</p>
                </>
            ) : (
                <>
                    <button onClick={openLoginModal}>Entrar</button>
                    <img src={foto} id="faculHub" alt="Foto de perfil" />
                    <h1>{nome}</h1>
                    <p>Inscrições: 7</p>
                </>
            )}
        </div>
    );
}

// Função do Postagem
function Postagem({ fotoMain, nomeCurso, instituicao, numInscritos, numComentarios,
    usuarioLogado, openModal, cursoId, onInscricao, inscritoInicial }) {

    const [showComentarioModal, setShowComentarioModal] = useState(false);
    const [comentariosCount, setComentariosCount] = useState(numComentarios); // Contagem de comentários
    const [inscrito, setInscrito] = useState(inscritoInicial);
    const [inscritos, setInscritos] = useState(numInscritos);

    const flechaCheia = "./flecha_cima_cheia.svg";
    const flechaVazia = "./flecha_cima_vazia.svg";

    const [flecha, setFlecha] = useState(inscritoInicial ? flechaCheia : flechaVazia);

    useEffect(() => { setFlecha(inscritoInicial ? flechaCheia : flechaVazia); setInscrito(inscritoInicial) }, [inscritoInicial])


    const handleInscricao = async () => {
        if (!usuarioLogado) {
            openModal();
        } else if (!inscrito) {
            const sendApi = { usuario_id: usuarioLogado.id, curso_id: cursoId };
            try {
                const response = await axios.post('http://localhost:3001/api/inscricao', sendApi);
                if (response.data.success) {
                    setInscrito(true);
                    setFlecha(flechaCheia);
                    setInscritos(inscritos + 1);
                    onInscricao();
                }
            } catch (error) {
                console.error('Erro ao fazer inscrição:', error);
            }
        } else {
            try {
                const response = await axios.delete(`http://localhost:3001/api/inscricao/${usuarioLogado.id}/${cursoId}`);
                if (response.data.success) {
                    setInscrito(false);
                    setFlecha(flechaVazia);
                    setInscritos(inscritos - 1);
                    onInscricao();
                }
            } catch (error) {
                console.error('Erro ao desinscrever:', error);
            }
        }
    };

    const handleChatClick = () => {
        if (!usuarioLogado) {
            openModal();
        } else {
            setShowComentarioModal(true);
        }
    };

    const closeComentarioModal = () => {
        setShowComentarioModal(false);
    };

    const handleComentarioEnviado = () => {
        setComentariosCount(prev => prev + 1);
    };

    return (
        <>
            <div className="titlePubli">
                <p>{nomeCurso}</p>
                <p>{instituicao}</p>
            </div>
            <img src={fotoMain} id="eletromecanica" alt="eletromecanica" />
            <div className="flechaChat">
                <div className="leftMain">
                    <img src={flecha} alt="flecha" onClick={handleInscricao} />
                    <p>{inscritos} inscritos</p>
                </div>
                <div className="leftMain">
                    <img src="chat.svg" alt="chat" onClick={handleChatClick} />
                    <p>{comentariosCount} comentários</p>
                </div>
            </div>

            {showComentarioModal && (
                <ComentarioModal
                    cursoId={cursoId}
                    usuarioLogado={usuarioLogado}
                    onComentarioEnviado={handleComentarioEnviado}
                    closeModal={closeComentarioModal}
                />
            )}
        </>
    );
}

function ComentarioModal({ cursoId, usuarioLogado, onComentarioEnviado, closeModal }) {
    const [comentarios, setComentarios] = useState([]);
    const [comentario, setComentario] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    useEffect(() => {
        const fetchComentarios = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/comentarios/${cursoId}`);
                setComentarios(response.data);
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);
            }
        };
        fetchComentarios();
    }, [cursoId]);

    const handleComentarioChange = (event) => {
        const texto = event.target.value;
        setComentario(texto);
        setIsButtonDisabled(texto.trim() === '');
    };

    const handleComentar = async () => {
        if (comentario.trim()) {
            try {
                const response = await axios.post('http://localhost:3001/api/comentario', {
                    usuario_id: usuarioLogado.id,
                    curso_id: cursoId,
                    texto: comentario
                });
                if (response.data.success) {
                    // Adiciona o novo comentário com o nome do usuário diretamente à lista
                    setComentarios([...comentarios, response.data.comentario]);
                    onComentarioEnviado(); // Atualiza a contagem de comentários na postagem
                    setComentario(''); // Limpa o campo de texto
                    setIsButtonDisabled(true); // Desativa o botão novamente
                }
            } catch (error) {
                console.error('Erro ao comentar:', error);
            }
        }
    };


    return (
        <div className="comentario-modal">
            <div className="comentarios-lista">
                {comentarios.map((cmt, index) => (
                    <div key={cmt.id_comentario || `index-${index}`} className="comentario-item">
                        <p>
                            <strong>{cmt.usuario?.nome || 'Anônimo'}:</strong> {cmt.texto}
                        </p>
                    </div>
                ))}
            </div>

            <textarea
                value={comentario}
                onChange={handleComentarioChange}
                placeholder="Escreva seu comentário"
            />
            <button
                className='comentar'
                disabled={isButtonDisabled}
                onClick={handleComentar}
            >
                Comentar
            </button>
            <button onClick={closeModal}>Fechar</button>
        </div>
    );
}





// Função do LoginModal
function LoginModal({ showModal, closeModal, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [isInvalid, setIsInvalid] = useState({ email: false, senha: false });

    const handleLogin = async () => {
        setError('');
        setIsInvalid({ email: false, senha: false });

        try {
            const response = await axios.post('http://localhost:3001/api/login', { email, senha });
            if (response.data.success) {
                onLoginSuccess(response.data.user);
                closeModal();
            } else {
                setError('Usuário ou senha incorretos');
                if (!email) setIsInvalid((prev) => ({ ...prev, email: true }));
                if (!senha) setIsInvalid((prev) => ({ ...prev, senha: true }));
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            setError('Erro ao fazer login. Tente novamente.');
        }
    };

    if (!showModal) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Login</h2>
                {error && <p className="error-message">{error}</p>}
                <div>
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={isInvalid.email ? 'input-error' : ''}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={isInvalid.senha ? 'input-error' : ''}
                    />
                </div>
                <div className="modal-buttons">
                    <button className="cancel-btn" onClick={closeModal}>Cancelar</button>
                    <button className="enter-btn" onClick={handleLogin}>Entrar</button>
                </div>
            </div>
        </div>
    );
}

// Função Main
function Main({ usuarioLogado, openModal }) {

    const [cursos, setCursos] = useState([]);


    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/cursos');
                const cursosComInscricao = await Promise.all(
                    response.data.map(async (curso) => {
                        if (usuarioLogado) {
                            const inscricaoResponse = await axios.get(`http://localhost:3001/api/inscricao/${usuarioLogado.id}/${curso.id_curso}`);
                            return { ...curso, inscrito: inscricaoResponse.data.inscrito };
                        } else {
                            return { ...curso, inscrito: false };
                        }
                    })
                );
                setCursos(cursosComInscricao);
            } catch (error) {
                console.error('Erro ao buscar cursos:', error);
            }
        };
        fetchCursos();
    }, [usuarioLogado]);


    const handleInscricao = () => {
        // Aqui, pode-se atualizar a lista de cursos caso necessário
        // Ou realizar outras ações necessárias após a inscrição
    };

    return (
        <div id="tudo">
            <h2>Cursos</h2>
            {cursos.map((curso) => {
                console.log(curso)
                return (
                    <Postagem
                        key={curso.id_curso}
                        cursoId={curso.id_curso}
                        nomeCurso={curso.nome_curso}
                        fotoMain={curso.foto}
                        instituicao={curso.instituicao}
                        numInscritos={curso.numInscritos}
                        numComentarios={curso.numComentarios}
                        usuarioLogado={usuarioLogado}
                        inscritoInicial={curso.inscrito} // Novo prop
                        openModal={openModal}
                        onInscricao={handleInscricao}
                    />

                )
            })}
        </div>
    );
}



function Comentar({ cursoId, usuarioLogado, onComentarioAdicionado }) {
    const [comentario, setComentario] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const handleComentarioChange = (event) => {
        const texto = event.target.value;
        setComentario(texto);

        // Habilita o botão de comentar apenas se o texto não estiver vazio
        if (texto.trim() === '') {
            setIsButtonDisabled(true);
        } else {
            setIsButtonDisabled(false);
        }
    };

    const handleComentar = async () => {
        if (comentario.trim()) {
            try {
                const response = await axios.post('http://localhost:3001/api/comentarios', {
                    usuario_id: usuarioLogado.id,
                    curso_id: cursoId,
                    texto: comentario
                });
                if (response.data.success) {
                    onComentarioAdicionado(); // Chama a função para atualizar a lista de comentários
                    setComentario(''); // Limpa a área de texto após comentar
                    setIsButtonDisabled(true); // Desabilita o botão novamente
                }
            } catch (error) {
                console.error('Erro ao comentar:', error);
            }
        }
    };

    return (
        <div className="comentar">
            <textarea
                value={comentario}
                onChange={handleComentarioChange}
                placeholder="Escreva seu comentário"
            />
            <button
                disabled={isButtonDisabled}
                onClick={handleComentar}
            >
                Comentar
            </button>
        </div>
    );
}

function ComentarioInput({ cursoId, usuarioLogado, onComentarioEnviado, closeModal }) {
    const [comentario, setComentario] = useState('');
    const [erro, setErro] = useState('');

    const handleComentarioChange = (e) => {
        setComentario(e.target.value);
    };

    const handleComentarioSubmit = async () => {
        if (!comentario) {
            setErro('Por favor, digite um comentário.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:3001/api/comentario', {
                curso_id: cursoId,
                usuario_id: usuarioLogado.id,
                texto: comentario
            });

            if (response.data.success) {
                onComentarioEnviado(); // Atualiza a publicação com o novo comentário
                closeModal(); // Fecha o modal de comentário
            } else {
                setErro('Erro ao enviar comentário.');
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            setErro('Erro ao enviar comentário. Tente novamente.');
        }
    };

    return (
        <div className="comentario-input">
            <textarea
                placeholder="Digite seu comentário..."
                value={comentario}
                onChange={handleComentarioChange}
            />
            {erro && <p className="error-message">{erro}</p>}
            <div>
                <button onClick={closeModal}>Cancelar</button>
                <button onClick={handleComentarioSubmit}>Enviar</button>
            </div>
        </div>
    );
}





// Função principal App.js

function App() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [empresa, setEmpresa] = useState(null);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const handleLoginSuccess = (user) => {
        setUsuarioLogado(user);
        fetchFotoUsuario();
    };

    const handleLogout = () => {
        setUsuarioLogado(null);
        window.location.reload();
    };

    useEffect(() => {
        const fetchEmpresa = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/empresa');
                setEmpresa(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados da empresa:', error);
            }
        };
        fetchEmpresa();
    }, []);


    const fetchFotoUsuario = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/usuarios/${usuarioLogado.id}`);
            setUsuarioLogado((prev) => ({ ...prev, foto: response.data.foto }));
        } catch (error) {
            console.error('Erro ao buscar foto do usuário:', error);
        }
    };



    return (
        <div className="App">
            <Header />
            <div id="principal">
                <Perfil
                    foto={usuarioLogado && usuarioLogado.foto ? usuarioLogado.foto : empresa ? empresa.logo : "default_logo.png"}
                    nome={usuarioLogado ? usuarioLogado.nome : empresa ? empresa.nome : "FaculHub"}
                    openLoginModal={openModal}
                    onLogout={handleLogout}
                    usuarioLogado={usuarioLogado}
                />
                <Main usuarioLogado={usuarioLogado} openModal={openModal} />
                <LoginModal
                    showModal={isModalVisible}
                    closeModal={closeModal}
                    onLoginSuccess={handleLoginSuccess}
                />
            </div>
        </div>
    );
}

export default App;