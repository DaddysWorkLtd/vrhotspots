//import('jest').Config

const models = require('../models')

test('exports tests', () => {
        expect(typeof models.testing).toBe('object')
})
const day=60*60*24*1000

test('calcNextInterval incorrect answer', () => {
        expect(models.testing.calcNextInterval(0, 0, false)).toBe(0)
        expect(models.testing.calcNextInterval(-day, 0, false)).toBe(0)
        expect(models.testing.calcNextInterval(day, 0, false)/day).toBeGreaterThan(.1)
        expect(models.testing.calcNextInterval(day, 0.25, false)/day).toBeGreaterThan(.19)
        expect(models.testing.calcNextInterval(day, 0.5, false)/day).toBeGreaterThan(.33)
        expect(models.testing.calcNextInterval(day, 0.75, false)/day).toBeGreaterThan(.57)
        expect(models.testing.calcNextInterval(day, 1, false)/day).toBe(1)
})

test('calcNextInterval correct answer', () => {
        expect(models.testing.calcNextInterval(0, 0, true)/day).toBeGreaterThan(0.04)
        expect(models.testing.calcNextInterval(-day, 0, true)/day).toBeGreaterThan(0.04)
        expect(models.testing.calcNextInterval(0, 1, true)/day).toBeGreaterThan(1)
        expect(models.testing.calcNextInterval(0, 0.5, true)/day).toBeGreaterThan(.3)

        expect(models.testing.calcNextInterval(day, 0, true)/day).toBeGreaterThan(.4)
        expect(models.testing.calcNextInterval(day, 0.25, true)/day).toBeGreaterThan(.8)
        expect(models.testing.calcNextInterval(day, 0.5, true)/day).toBeGreaterThan(1.3)
        expect(models.testing.calcNextInterval(day, 0.75, true)/day).toBeGreaterThan(2.4)
        expect(models.testing.calcNextInterval(day, 1, true)/day).toBeGreaterThan(4)
        expect(models.testing.calcNextInterval(4*day, 1, true)/day).toBeGreaterThan(16.6)
        expect(models.testing.calcNextInterval(7*day, 1, true)/day).toBeGreaterThan(29)
        expect(models.testing.calcNextInterval(29*day, 1, true)/day).toBeGreaterThan(120)
        expect(models.testing.calcNextInterval(120*day, 1, true)/day).toBe(180)
})

test('calcNextInterval zero milliseconds', () => {
        expect(models.testing.calcNextInterval(day, 0, true)%1000).toBe(0)
        expect(models.testing.calcNextInterval(day, 0.5, false)%1000).toBe(0)
        expect(models.testing.calcNextInterval(0, 0, false)%1000).toBe(0)
})