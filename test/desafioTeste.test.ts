import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { novoDesafio, conferirDesafio, bitsZerados } from '../lib/desafioTeste.ts'

/* 05/10 — anti-robô do cadastro do teste grátis: desafio assinado, resolvido 1 vez, dentro da validade. */
const resolver = (desafio: string) => {
  const [sal, , bits] = desafio.split('.')
  for (let i = 0; ; i++) if (bitsZerados(crypto.createHash('sha256').update(`${sal}:${i}`).digest()) >= Number(bits)) return String(i)
}

test('bitsZerados conta os bits zerados do começo', () => {
  assert.equal(bitsZerados(Uint8Array.from([0, 0, 0x80])), 16)
  assert.equal(bitsZerados(Uint8Array.from([0, 0x01])), 15)
  assert.equal(bitsZerados(Uint8Array.from([0xff])), 0)
})

test('desafio resolvido passa 1 vez; repetido, adulterado ou nonce errado não passam', () => {
  const d = novoDesafio()
  const n = resolver(d)
  assert.equal(conferirDesafio(d, n), true)
  assert.equal(conferirDesafio(d, n), false)                                  // vale 1 vez
  const d2 = novoDesafio()
  const n2 = resolver(d2)
  const [sal, val, , sig] = d2.split('.')
  assert.equal(conferirDesafio(`${sal}.${val}.8.${sig}`, n2), false)          // baixar a dificuldade quebra a assinatura
  let errado = 0
  while (bitsZerados(crypto.createHash('sha256').update(`${sal}:${errado}`).digest()) >= Number(d2.split('.')[2])) errado++
  assert.equal(conferirDesafio(d2, String(errado)), false)                   // nonce que não resolve
  assert.equal(conferirDesafio(d2, n2), true)                                 // e o certo ainda vale (não foi gasto)
  assert.equal(conferirDesafio('lixo', '1'), false)
})
