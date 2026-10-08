"""Le jeu de test (2011-2015) ne sert jamais à apprendre ni à choisir."""

from ml.scripts.config import CIBLE
from ml.scripts.donnees import preparer
from ml.scripts.entrainement import choisir_modele


def test_choix_du_modele_sans_le_test(dataset):
    df = preparer(dataset)
    train = df[df.jeu == "train"]
    choix, _ = choisir_modele(train)

    # Modifier le test ne change rien au choix : il n'est pas utilisé.
    dataset.loc[dataset.jeu == "test", CIBLE] *= 100
    train2 = preparer(dataset).query("jeu == 'train'")
    assert choisir_modele(train2)[0] == choix


def test_production_t_jamais_utilisee():
    from ml.scripts.config import FEATURES

    assert "production_t" not in FEATURES
    assert CIBLE not in FEATURES
