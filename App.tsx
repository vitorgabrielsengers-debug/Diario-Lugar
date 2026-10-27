import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

type Lugar = {
  id: string;
  titulo: string;
  descricao: string;
  foto: string;
  latitude: number;
  longitude: number;
  data: string;
};

const CHAVE = '@diario_de_lugares/registros';

export default function App() {
  const cameraRef = useRef<CameraViewType | null>(null);
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number } | null>(null);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  const [registros, setRegistros] = useState<Lugar[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function carregarRegistros() {
    try {
      const dados = await AsyncStorage.getItem(CHAVE);
      if (dados) setRegistros(JSON.parse(dados) as Lugar[]);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os registros salvos.');
    }
  }

  async function obterLocalizacao() {
    setCarregandoLocalizacao(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização para registrar onde você está.');
        return;
      }
      const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordenadas({
        latitude: local.coords.latitude,
        longitude: local.coords.longitude,
      });
      Alert.alert('Localização obtida', 'A localização foi registrada para este lugar.');
    } catch {
      Alert.alert('Não foi possível obter a localização', 'Confira se o GPS está ligado e tente novamente.');
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  async function abrirCamera() {
    if (!permissaoCamera?.granted) {
      const resultado = await pedirPermissaoCamera();
      if (!resultado.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para fotografar um lugar.');
        return;
      }
    }
    setFoto(null);
    setCameraPronta(false);
    setCameraAberta(true);
  }

  async function tirarFoto() {
    if (!cameraRef.current || !cameraPronta) {
      Alert.alert('Aguarde', 'A câmera ainda está iniciando.');
      return;
    }
    try {
      const resultado = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (resultado?.uri) {
        setFoto(resultado.uri);
        setCameraAberta(false);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
  }

  async function salvarRegistro() {
    if (!titulo.trim()) {
      Alert.alert('Falta o título', 'Digite um nome para este lugar.');
      return;
    }
    if (!foto) {
      Alert.alert('Falta a foto', 'Tire uma foto do lugar antes de salvar.');
      return;
    }
    if (!coordenadas) {
      Alert.alert('Falta a localização', 'Toque em “Obter localização” antes de salvar.');
      return;
    }

    setSalvando(true);
    try {
      const novo: Lugar = {
        id: `${Date.now()}`,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        foto,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        data: new Date().toISOString(),
      };
      const atualizados = [novo, ...registros];
      await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizados));
      setRegistros(atualizados);
      setTitulo('');
      setDescricao('');
      setFoto(null);
      setCoordenadas(null);
      setCameraAberta(false);
      Alert.alert('Salvo!', 'O lugar foi adicionado ao seu diário.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar este lugar no celular.');
    } finally {
      setSalvando(false);
    }
  }

  function excluirRegistro(id: string) {
    Alert.alert('Excluir registro', 'Deseja apagar este lugar do diário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const atualizados = registros.filter((item) => item.id !== id);
          await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizados));
          setRegistros(atualizados);
        },
      },
    ]);
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR');
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>📍 Diário de Lugares</Text>
        <Text style={styles.subtitulo}>Guarde fotos e lembranças dos lugares que você visitou.</Text>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>Registrar um lugar</Text>
          <Text style={styles.rotulo}>Nome do lugar *</Text>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex.: Praça central"
            style={styles.input}
            maxLength={70}
          />
          <Text style={styles.rotulo}>Descrição / lembrança</Text>
          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="O que você quer lembrar deste lugar?"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={300}
          />

          {cameraAberta ? (
            <View>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() => setCameraPronta(true)}
              />
              <TouchableOpacity style={styles.botao} onPress={tirarFoto}>
                <Text style={styles.textoBotao}>📸 Tirar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSecundario} onPress={() => setCameraAberta(false)}>
                <Text style={styles.textoBotaoSecundario}>Cancelar câmera</Text>
              </TouchableOpacity>
            </View>
          ) : foto ? (
            <View>
              <Image source={{ uri: foto }} style={styles.fotoPreview} />
              <TouchableOpacity style={styles.botaoSecundario} onPress={abrirCamera}>
                <Text style={styles.textoBotaoSecundario}>Tirar outra foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.botao} onPress={abrirCamera}>
              <Text style={styles.textoBotao}>📷 Abrir câmera</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.botaoSecundario, coordenadas && styles.botaoOk]}
            onPress={obterLocalizacao}
            disabled={carregandoLocalizacao}
          >
            <Text style={styles.textoBotaoSecundario}>
              {carregandoLocalizacao ? 'Obtendo localização...' : coordenadas ? '✓ Localização obtida' : '📍 Obter localização'}
            </Text>
          </TouchableOpacity>

          {coordenadas && (
            <Text style={styles.coordenadas}>
              Latitude: {coordenadas.latitude.toFixed(6)}{"\n"}
              Longitude: {coordenadas.longitude.toFixed(6)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.botao, salvando && styles.botaoDesativado]}
            onPress={salvarRegistro}
            disabled={salvando}
          >
            <Text style={styles.textoBotao}>{salvando ? 'Salvando...' : '💾 Salvar no diário'}</Text>
          </TouchableOpacity>
          <Text style={styles.observacao}>* A foto e a localização são necessárias para salvar um registro.</Text>
        </View>

        <View style={styles.listaCabecalho}>
          <Text style={styles.tituloSecao}>Meus lugares</Text>
          <Text style={styles.contador}>{registros.length}</Text>
        </View>

        {registros.length === 0 ? (
          <Text style={styles.vazio}>Seus lugares salvos aparecerão aqui.</Text>
        ) : (
          <FlatList
            data={registros}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Image source={{ uri: item.foto }} style={styles.fotoItem} />
                <View style={styles.detalhesItem}>
                  <Text style={styles.nomeItem}>{item.titulo}</Text>
                  {!!item.descricao && <Text style={styles.descricaoItem}>{item.descricao}</Text>}
                  <Text style={styles.dataItem}>{formatarData(item.data)}</Text>
                  <Text style={styles.coordsItem}>
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                  </Text>
                  <TouchableOpacity onPress={() => excluirRegistro(item.id)}>
                    <Text style={styles.excluir}>Excluir registro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f3f6fb' },
  conteudo: { padding: 18, paddingBottom: 40 },
  logo: { fontSize: 27, fontWeight: '800', color: '#203864', marginTop: 14 },
  subtitulo: { fontSize: 15, color: '#5d687a', marginTop: 6, marginBottom: 18, lineHeight: 22 },
  cartao: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 2 },
  tituloSecao: { fontSize: 20, fontWeight: '700', color: '#203864', marginBottom: 12 },
  rotulo: { color: '#344054', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d7deea', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fbfcff', color: '#172033' },
  textarea: { minHeight: 78, textAlignVertical: 'top' },
  botao: { backgroundColor: '#3157a4', borderRadius: 11, padding: 14, alignItems: 'center', marginTop: 12 },
  textoBotao: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botaoSecundario: { backgroundColor: '#e8eefb', borderRadius: 11, padding: 13, alignItems: 'center', marginTop: 10 },
  textoBotaoSecundario: { color: '#244780', fontWeight: '700', fontSize: 14 },
  botaoOk: { backgroundColor: '#e1f5e8' },
  camera: { height: 300, borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  fotoPreview: { height: 240, borderRadius: 12, marginTop: 12, resizeMode: 'cover' },
  coordenadas: { color: '#344054', fontSize: 13, lineHeight: 20, marginTop: 10, textAlign: 'center' },
  observacao: { color: '#7b8494', fontSize: 12, marginTop: 12, lineHeight: 18 },
  listaCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contador: { backgroundColor: '#dce7fb', color: '#244780', fontWeight: '700', borderRadius: 16, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 5, marginBottom: 12 },
  vazio: { color: '#697586', backgroundColor: '#fff', borderRadius: 12, padding: 18, textAlign: 'center' },
  item: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12, elevation: 1 },
  fotoItem: { width: 100, height: 125, borderRadius: 10, backgroundColor: '#e5e7eb' },
  detalhesItem: { flex: 1 },
  nomeItem: { fontSize: 17, fontWeight: '700', color: '#203864' },
  descricaoItem: { color: '#4b5563', marginTop: 5, lineHeight: 19 },
  dataItem: { color: '#7b8494', fontSize: 11, marginTop: 8 },
  coordsItem: { color: '#536780', fontSize: 11, marginTop: 4 },
  excluir: { color: '#b42318', fontWeight: '700', marginTop: 8 },
  botaoDesativado: { opacity: 0.6 },
});
