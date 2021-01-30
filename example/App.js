import React, { useState } from 'react'
import { StyleSheet, Text, View, Image, Alert, TouchableOpacity, Dimensions } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import ProgressCircle from 'react-native-progress/Circle'
import TesseractOcr, { LANG_ENGLISH, useEventListener } from 'react-native-tesseract-ocr'
import TouchID from 'react-native-touch-id'

const DEFAULT_HEIGHT = 500
const DEFAULT_WITH = 600
const defaultPickerOptions = {
    cropping: true,
    height: DEFAULT_HEIGHT,
    width: DEFAULT_WITH,
}

function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [imgSrc, setImgSrc] = useState(null)
    const [text, setText] = useState('')
    const [touchID, setTouchID] = useState('')
    const [available, setAvailable] = useState(false)

    useEventListener('onProgressChange', (p) => {
        setProgress(p.percent / 100)
    })

    const recognizeTextFromImage = async (path) => {
        setIsLoading(true)

        try {
            const tesseractOptions = {}
            const recognizedText = await TesseractOcr.recognize(path, LANG_ENGLISH, tesseractOptions)
            setText(recognizedText)
        } catch (err) {
            console.error(err)
            setText('')
        }

        setIsLoading(false)
        setProgress(0)
    }

    const recognizeFromPicker = async (options = defaultPickerOptions) => {
        try {
            const image = await ImagePicker.openPicker(options)
            setImgSrc({ uri: image.path })
            await recognizeTextFromImage(image.path)
        } catch (err) {
            if (err.message !== 'User cancelled image selection') {
                console.error(err)
            }
        }
    }

    const launchTouchId = () => {
        const config = {
            title: 'Autenticación requerida',
            imageColor: '#13B9A7',
            sensorDescription: 'Sensor TouchID',
            sensorErrorDescription: 'Autenticación Incorrecta',
            cancelText: 'Cancelar',
        }
        TouchID.authenticate('Por favor use Touch ID para autenticar.', config)
            .then(() => {
                console.log('TouchID Correcto')
                setAvailable(true)
            })
            .catch((error) => {
                {
                    error.code != 'AUTHENTICATION_CANCELED' ? Alert.alert('Autenticación Incorrecta', 'Por favor vuelve a intentarlo') : ''
                }
                console.log('Error auth touch:', error.code)
            })
    }

    const verifyBiometric = async () => {
        await TouchID.isSupported({ unifiedErrors: false, passcodeFallback: true })
            .then((biometryType) => {
                if (biometryType === 'FaceID') console.log('FaceID is supported.')
                else {
                    setTouchID(true)
                    console.log('TouchID is supported.')
                    launchTouchId()
                }
            })
            .catch((error) => {
                console.log('Error biometry touch:', error.code)
            })
    }

    const recognizeFromCamera = async (options = defaultPickerOptions) => {
        try {
            const image = await ImagePicker.openCamera(options)
            setImgSrc({ uri: image.path })
            await recognizeTextFromImage(image.path)
        } catch (err) {
            if (err.message !== 'User cancelled image selection') {
                console.error(err)
            }
        }
    }

    verifyBiometric()

    return (
        <>
            {available ? (
                <View style={styles.container}>
                    {imgSrc ? (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity disabled={isLoading} style={styles.btnReturn} onPress={() => setImgSrc(undefined)}>
                                <Text style={styles.textReturn}>Regresar</Text>
                            </TouchableOpacity>
                            <Image style={styles.image} source={imgSrc} />
                            {isLoading ? <ProgressCircle showsText progress={progress} /> : <Text>{text}</Text>}
                        </View>
                    ) : (
                        <View style={styles.options}>
                            <Text style={styles.title}>Reconocimiento de Texto en Imágenes</Text>
                            <View style={styles.button}>
                                <TouchableOpacity disabled={isLoading} style={styles.btnCamera} onPress={() => recognizeFromCamera()}>
                                    <Text style={styles.text}>Desde Cámara</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.button}>
                                <TouchableOpacity disabled={isLoading} style={styles.btnGalery} onPress={() => recognizeFromPicker()}>
                                    <Text style={styles.text}>Desde Galería</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            ) : touchID ? null : (
                <View style={styles.container}>
                    <TouchableOpacity
                        onPress={() => setAvailable(true)}
                        style={{ backgroundColor: 'gray', borderRadius: 30, padding: 10, marginTop: 50 }}
                    >
                        <Text>Entrar de todas formas</Text>
                    </TouchableOpacity>
                    <View style={styles.error}>
                        <Text style={styles.textError}>Chuta loco, parece que tu celular no tiene lector de huellas digitales. #yanadaya</Text>
                    </View>
                </View>
            )}
        </>
    )
}

const { height, width } = Dimensions.get('window')
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    options: {
        justifyContent: 'flex-end',
        padding: 10,
    },
    button: { marginHorizontal: 10 },
    btnCamera: {
        backgroundColor: '#f194ff',
        height: height * 0.4,
        width: width * 0.9,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 60,
    },
    btnGalery: {
        backgroundColor: '#2196F3',
        width: width * 0.9,
        height: height * 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    btnReturn: {
        backgroundColor: '#2196F3',
        width: width * 0.35,
        height: height * 0.05,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        marginVertical: 10,
    },
    textReturn: {
        fontSize: 20,
        color: 'white',
    },
    title: {
        fontSize: 25,
        textShadowColor: '#f194ff',
    },
    text: {
        fontSize: 42,
        color: 'white',
    },
    error: {
        marginVertical: 100,
        paddingHorizontal: 20,
    },
    textError: {
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        marginVertical: 15,
        height: DEFAULT_HEIGHT / 2.5,
        width: DEFAULT_WITH / 2.5,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
})

export default App
